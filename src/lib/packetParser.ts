export interface ParsedPacket {
  protocol: string;
  source: string;
  destination: string;
  length: number;
  info: string;
  timestamp?: string;
  details: Record<string, unknown>;
}

export interface PacketParseResult {
  packets: ParsedPacket[];
  format: 'wireshark' | 'tcpdump' | 'json' | 'csv' | 'unknown';
  totalPackets: number;
}

export function parsePacketData(content: string): PacketParseResult {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Try to detect format
  const format = detectFormat(content);
  
  switch (format) {
    case 'wireshark':
      return parseWiresharkFormat(lines);
    case 'tcpdump':
      return parseTcpdumpFormat(lines);
    case 'json':
      return parseJsonFormat(content);
    case 'csv':
      return parseCsvFormat(lines);
    default:
      return parseGenericFormat(lines);
  }
}

function detectFormat(content: string): 'wireshark' | 'tcpdump' | 'json' | 'csv' | 'unknown' {
  // JSON format detection
  try {
    JSON.parse(content);
    return 'json';
  } catch {}
  
  // CSV format detection (simple heuristic)
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length > 0 && lines[0].includes(',') && lines[0].toLowerCase().includes('source')) {
    return 'csv';
  }
  
  // Wireshark format detection
  if (content.includes('Frame ') || content.includes('Ethernet II') || content.includes('Internet Protocol')) {
    return 'wireshark';
  }
  
  // tcpdump format detection
  if (/\d{2}:\d{2}:\d{2}\.\d+/.test(content) && content.includes(' > ')) {
    return 'tcpdump';
  }
  
  return 'unknown';
}

function parseWiresharkFormat(lines: string[]): PacketParseResult {
  const packets: ParsedPacket[] = [];
  let currentPacket: Partial<ParsedPacket> = {};
  
  for (const line of lines) {
    if (line.startsWith('Frame ')) {
      if (currentPacket.protocol) {
        packets.push(currentPacket as ParsedPacket);
      }
      currentPacket = {
        protocol: 'Unknown',
        source: 'Unknown',
        destination: 'Unknown',
        length: 0,
        info: '',
        details: {}
      };
    }
    
    // Parse Ethernet layer
    if (line.includes('Ethernet II')) {
      const srcMatch = line.match(/Src: ([a-fA-F0-9:]+)/);
      const dstMatch = line.match(/Dst: ([a-fA-F0-9:]+)/);
      if (srcMatch) currentPacket.source = srcMatch[1];
      if (dstMatch) currentPacket.destination = dstMatch[1];
    }
    
    // Parse IP layer
    if (line.includes('Internet Protocol')) {
      const srcMatch = line.match(/Src: (\d+\.\d+\.\d+\.\d+)/);
      const dstMatch = line.match(/Dst: (\d+\.\d+\.\d+\.\d+)/);
      if (srcMatch) currentPacket.source = srcMatch[1];
      if (dstMatch) currentPacket.destination = dstMatch[1];
    }
    
    // Parse protocol
    if (line.includes('Protocol: ')) {
      const protocolMatch = line.match(/Protocol: (\w+)/);
      if (protocolMatch) currentPacket.protocol = protocolMatch[1];
    }
    
    // Parse length
    if (line.includes('Length: ')) {
      const lengthMatch = line.match(/Length: (\d+)/);
      if (lengthMatch) currentPacket.length = parseInt(lengthMatch[1]);
    }
    
    // Store additional details
    if (line.includes(':') && !line.startsWith('Frame ')) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        currentPacket.details![key.trim()] = value.trim();
      }
    }
  }
  
  if (currentPacket.protocol) {
    packets.push(currentPacket as ParsedPacket);
  }
  
  return {
    packets,
    format: 'wireshark',
    totalPackets: packets.length
  };
}

function parseTcpdumpFormat(lines: string[]): PacketParseResult {
  const packets: ParsedPacket[] = [];
  
  for (const line of lines) {
    const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d+)/);
    const connectionMatch = line.match(/(\S+) > (\S+):/);
    const lengthMatch = line.match(/length (\d+)/);
    
    if (timestampMatch && connectionMatch) {
      const packet: ParsedPacket = {
        timestamp: timestampMatch[1],
        source: connectionMatch[1],
        destination: connectionMatch[2],
        length: lengthMatch ? parseInt(lengthMatch[1]) : 0,
        protocol: detectProtocolFromTcpdump(line),
        info: line.substring(line.indexOf(': ') + 2) || line,
        details: { rawLine: line }
      };
      
      packets.push(packet);
    }
  }
  
  return {
    packets,
    format: 'tcpdump',
    totalPackets: packets.length
  };
}

function parseJsonFormat(content: string): PacketParseResult {
  try {
    const data = JSON.parse(content);
    const packets: ParsedPacket[] = [];
    
    if (Array.isArray(data)) {
      for (const item of data) {
        // Check if this is an Elasticsearch document with _source
        if (item._source && item._source.layers) {
          const packet = parseElasticsearchPacket(item);
          if (packet) packets.push(packet);
        } else {
          // Standard JSON format
          const packet: ParsedPacket = {
            protocol: item.protocol || 'Unknown',
            source: item.source || item.src || 'Unknown',
            destination: item.destination || item.dst || 'Unknown',
            length: item.length || item.size || 0,
            info: item.info || item.description || '',
            timestamp: item.timestamp || item.time,
            details: item
          };
          packets.push(packet);
        }
      }
    } else {
      // Single object - check if it's an Elasticsearch document
      if (data._source && data._source.layers) {
        const packet = parseElasticsearchPacket(data);
        if (packet) packets.push(packet);
      } else {
        // Single packet in standard format
        const packet: ParsedPacket = {
          protocol: data.protocol || 'Unknown',
          source: data.source || data.src || 'Unknown',
          destination: data.destination || data.dst || 'Unknown',
          length: data.length || data.size || 0,
          info: data.info || data.description || '',
          timestamp: data.timestamp || data.time,
          details: data
        };
        packets.push(packet);
      }
    }
    
    return {
      packets,
      format: 'json',
      totalPackets: packets.length
    };
  } catch {
    return {
      packets: [],
      format: 'json',
      totalPackets: 0
    };
  }
}

function parseElasticsearchPacket(item: Record<string, unknown>): ParsedPacket | null {
  const sourceData = item._source as Record<string, unknown>;
  if (!sourceData) return null;
  
  const layers = sourceData.layers as Record<string, unknown>;
  if (!layers) return null;
  
  // Extract frame info
  const frame = (layers.frame || {}) as Record<string, unknown>;
  const frameNumber = frame['frame.number'] || 'Unknown';
  const timestamp = String(frame['frame.time'] || frame['frame.time_utc'] || '');
  const length = parseInt(String(frame['frame.len'] || '0'));
  const protocols = String(frame['frame.protocols'] || '');
  
  // Extract network layer info
  const eth = (layers.eth || {}) as Record<string, unknown>;
  const ip = (layers.ip || {}) as Record<string, unknown>;
  const tcp = (layers.tcp || {}) as Record<string, unknown>;
  const udp = (layers.udp || {}) as Record<string, unknown>;
  
  // Determine protocol hierarchy
  let protocol = 'Unknown';
  if (protocols.includes('tls')) protocol = 'TLS';
  else if (protocols.includes('http')) protocol = 'HTTP';
  else if (protocols.includes('tcp')) protocol = 'TCP';
  else if (protocols.includes('udp')) protocol = 'UDP';
  else if (protocols.includes('icmp')) protocol = 'ICMP';
  else if (protocols.includes('arp')) protocol = 'ARP';
  else if (protocols.includes('dns')) protocol = 'DNS';
  
  // Extract source and destination
  let source = 'Unknown';
  let destination = 'Unknown';
  
  if (ip['ip.src']) {
    source = String(ip['ip.src']);
    destination = String(ip['ip.dst'] || 'Unknown');
  } else if (eth['eth.src']) {
    source = String(eth['eth.src']);
    destination = String(eth['eth.dst'] || 'Unknown');
  }
  
  // Add port information for TCP/UDP
  if (tcp['tcp.srcport'] && tcp['tcp.dstport']) {
    source += ':' + String(tcp['tcp.srcport']);
    destination += ':' + String(tcp['tcp.dstport']);
  } else if (udp['udp.srcport'] && udp['udp.dstport']) {
    source += ':' + String(udp['udp.srcport']);
    destination += ':' + String(udp['udp.dstport']);
  }
  
  // Create info string
  let info = `Frame ${frameNumber}`;
  if (protocols) info += ` (${protocols})`;
  if (tcp['tcp.flags_tree']) {
    const flags = tcp['tcp.flags_tree'] as Record<string, unknown>;
    const flagStr = [];
    if (flags['tcp.flags.syn'] === '1') flagStr.push('SYN');
    if (flags['tcp.flags.ack'] === '1') flagStr.push('ACK');
    if (flags['tcp.flags.fin'] === '1') flagStr.push('FIN');
    if (flags['tcp.flags.push'] === '1') flagStr.push('PSH');
    if (flags['tcp.flags.reset'] === '1') flagStr.push('RST');
    if (flagStr.length > 0) info += ` [${flagStr.join(', ')}]`;
  }
  
  return {
    protocol,
    source,
    destination,
    length,
    info,
    timestamp,
    details: {
      frameNumber,
      layers: layers,
      protocols: protocols,
      ...(eth && Object.keys(eth).length > 0 ? { ethernet: eth } : {}),
      ...(ip && Object.keys(ip).length > 0 ? { ip: ip } : {}),
      ...(tcp && Object.keys(tcp).length > 0 ? { tcp: tcp } : {}),
      ...(udp && Object.keys(udp).length > 0 ? { udp: udp } : {}),
    }
  };
}

function parseCsvFormat(lines: string[]): PacketParseResult {
  const packets: ParsedPacket[] = [];
  
  if (lines.length === 0) return { packets, format: 'csv', totalPackets: 0 };
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const sourceIndex = headers.findIndex(h => h.includes('source') || h.includes('src'));
  const destIndex = headers.findIndex(h => h.includes('destination') || h.includes('dst'));
  const protocolIndex = headers.findIndex(h => h.includes('protocol'));
  const lengthIndex = headers.findIndex(h => h.includes('length') || h.includes('size'));
  const infoIndex = headers.findIndex(h => h.includes('info') || h.includes('description'));
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    
    const packet: ParsedPacket = {
      source: sourceIndex >= 0 ? values[sourceIndex]?.trim() || 'Unknown' : 'Unknown',
      destination: destIndex >= 0 ? values[destIndex]?.trim() || 'Unknown' : 'Unknown',
      protocol: protocolIndex >= 0 ? values[protocolIndex]?.trim() || 'Unknown' : 'Unknown',
      length: lengthIndex >= 0 ? parseInt(values[lengthIndex]) || 0 : 0,
      info: infoIndex >= 0 ? values[infoIndex]?.trim() || '' : '',
      details: {}
    };
    
    // Add all fields as details
    headers.forEach((header, index) => {
      if (values[index]) {
        packet.details[header] = values[index].trim();
      }
    });
    
    packets.push(packet);
  }
  
  return {
    packets,
    format: 'csv',
    totalPackets: packets.length
  };
}

function parseGenericFormat(lines: string[]): PacketParseResult {
  const packets: ParsedPacket[] = [];
  
  for (const line of lines) {
    // Try to extract basic info from generic format
    const packet: ParsedPacket = {
      protocol: 'Unknown',
      source: 'Unknown',
      destination: 'Unknown',
      length: 0,
      info: line,
      details: { rawLine: line }
    };
    
    // Try to extract IP addresses
    const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/g);
    if (ipMatch && ipMatch.length >= 2) {
      packet.source = ipMatch[0];
      packet.destination = ipMatch[1];
    }
    
    // Try to extract protocol
    const protocolMatch = line.match(/\b(TCP|UDP|ICMP|HTTP|HTTPS|FTP|SSH|DNS)\b/i);
    if (protocolMatch) {
      packet.protocol = protocolMatch[1].toUpperCase();
    }
    
    packets.push(packet);
  }
  
  return {
    packets,
    format: 'unknown',
    totalPackets: packets.length
  };
}

function detectProtocolFromTcpdump(line: string): string {
  if (line.includes('UDP')) return 'UDP';
  if (line.includes('TCP')) return 'TCP';
  if (line.includes('ICMP')) return 'ICMP';
  if (line.includes('ARP')) return 'ARP';
  if (line.includes('DNS')) return 'DNS';
  return 'Unknown';
}