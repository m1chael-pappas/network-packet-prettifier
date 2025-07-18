'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Zap, Shield, Globe, Wifi, Database, Link } from 'lucide-react';

interface PacketDetailsProps {
  packet: {
    protocol: string;
    source: string;
    destination: string;
    length: number;
    info: string;
    timestamp?: string;
    details: Record<string, unknown>;
  };
}

export function PacketDetails({ packet }: PacketDetailsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp || timestamp === 'N/A') return 'N/A';
    
    // Parse the timestamp format: "Jul 18, 2025 19:52:34.397787000 AUS Eastern Standard Time"
    const match = timestamp.match(/(\w{3} \d{1,2}, \d{4}) (\d{2}:\d{2}:\d{2})\.(\d{3})\d* (.+)/);
    if (match) {
      const [, date, time, milliseconds, timezone] = match;
      const shortTimezone = timezone.replace('AUS Eastern Standard Time', 'AEST')
                                    .replace('AUS Eastern Daylight Time', 'AEDT')
                                    .replace('Eastern Standard Time', 'EST')
                                    .replace('Eastern Daylight Time', 'EDT')
                                    .replace('Pacific Standard Time', 'PST')
                                    .replace('Pacific Daylight Time', 'PDT');
      
      return `${date} ${time}.${milliseconds} ${shortTimezone}`;
    }
    
    return timestamp;
  };

  // Extract meaningful information from the packet details
  const getFrameInfo = () => {
    const layers = packet.details.layers as Record<string, unknown> || {};
    const frame = (layers.frame as Record<string, unknown>) || {};
    return {
      number: String(frame['frame.number'] || 'N/A'),
      length: String(frame['frame.len'] || packet.length),
      timestamp: String(frame['frame.time'] || packet.timestamp || 'N/A'),
      protocols: String(frame['frame.protocols'] || 'Unknown'),
      interface: String((frame['frame.interface_id_tree'] as Record<string, unknown>)?.['frame.interface_description'] || 'Unknown')
    };
  };

  const getEthernetInfo = () => {
    const layers = packet.details.layers as Record<string, unknown> || {};
    const eth = (packet.details.ethernet as Record<string, unknown>) || (layers.eth as Record<string, unknown>) || {};
    return {
      srcMac: String(eth['eth.src'] || 'Unknown'),
      dstMac: String(eth['eth.dst'] || 'Unknown'),
      srcVendor: String((eth['eth.src_tree'] as Record<string, unknown>)?.['eth.src.oui_resolved'] || 'Unknown'),
      dstVendor: String((eth['eth.dst_tree'] as Record<string, unknown>)?.['eth.dst.oui_resolved'] || 'Unknown'),
      type: String(eth['eth.type'] || 'Unknown')
    };
  };

  const getIpInfo = () => {
    const layers = packet.details.layers as Record<string, unknown> || {};
    const ip = (packet.details.ip as Record<string, unknown>) || (layers.ip as Record<string, unknown>) || {};
    return {
      version: String(ip['ip.version'] || 'Unknown'),
      srcIp: String(ip['ip.src'] || 'Unknown'),
      dstIp: String(ip['ip.dst'] || 'Unknown'),
      protocol: String(ip['ip.proto'] || 'Unknown'),
      ttl: String(ip['ip.ttl'] || 'Unknown'),
      length: String(ip['ip.len'] || 'Unknown'),
      id: String(ip['ip.id'] || 'Unknown'),
      flags: String(ip['ip.flags'] || 'Unknown')
    };
  };

  const getTcpInfo = () => {
    const layers = packet.details.layers as Record<string, unknown> || {};
    const tcp = (packet.details.tcp as Record<string, unknown>) || (layers.tcp as Record<string, unknown>) || {};
    const flags = (tcp['tcp.flags_tree'] as Record<string, unknown>) || {};
    
    const activeFlags = [];
    if (flags['tcp.flags.syn'] === '1') activeFlags.push('SYN');
    if (flags['tcp.flags.ack'] === '1') activeFlags.push('ACK');
    if (flags['tcp.flags.fin'] === '1') activeFlags.push('FIN');
    if (flags['tcp.flags.push'] === '1') activeFlags.push('PSH');
    if (flags['tcp.flags.reset'] === '1') activeFlags.push('RST');
    if (flags['tcp.flags.urg'] === '1') activeFlags.push('URG');

    return {
      srcPort: String(tcp['tcp.srcport'] || 'Unknown'),
      dstPort: String(tcp['tcp.dstport'] || 'Unknown'),
      seq: String(tcp['tcp.seq'] || 'Unknown'),
      ack: String(tcp['tcp.ack'] || 'Unknown'),
      window: String(tcp['tcp.window_size_value'] || 'Unknown'),
      flags: activeFlags,
      stream: String(tcp['tcp.stream'] || 'Unknown')
    };
  };

  const getUdpInfo = () => {
    const layers = packet.details.layers as Record<string, unknown> || {};
    const udp = (packet.details.udp as Record<string, unknown>) || (layers.udp as Record<string, unknown>) || {};
    return {
      srcPort: String(udp['udp.srcport'] || 'Unknown'),
      dstPort: String(udp['udp.dstport'] || 'Unknown'),
      length: String(udp['udp.length'] || 'Unknown'),
      checksum: String(udp['udp.checksum'] || 'Unknown')
    };
  };

  const frameInfo = getFrameInfo();
  const ethernetInfo = getEthernetInfo();
  const ipInfo = getIpInfo();
  const tcpInfo = getTcpInfo();
  const udpInfo = getUdpInfo();

  const InfoCard = ({ title, icon: Icon, children, sectionKey }: { 
    title: string; 
    icon: React.ComponentType<{ className?: string }>; 
    children: React.ReactNode; 
    sectionKey: string;
  }) => (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {expandedSections.has(sectionKey) ? (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-500" />
        )}
      </div>
      {expandedSections.has(sectionKey) && (
        <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  );

  const DataField = ({ label, value, highlight = false }: { 
    label: string; 
    value: string | number; 
    highlight?: boolean;
  }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-600 dark:text-slate-400 text-sm">{label}</span>
      <span className={`font-mono text-sm px-2 py-1 rounded ${
        highlight 
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
      }`}>
        {value}
      </span>
    </div>
  );

  const FlagBadge = ({ flag, active }: { flag: string; active: boolean }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      active 
        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
    }`}>
      {flag}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Frame Information */}
      <InfoCard title="Frame Information" icon={Database} sectionKey="frame">
        <div className="space-y-3">
          <DataField label="Frame Number" value={`#${frameInfo.number}`} highlight />
          <DataField label="Frame Length" value={`${frameInfo.length} bytes`} />
          <DataField label="Interface" value={frameInfo.interface} />
          <DataField label="Timestamp" value={formatTimestamp(frameInfo.timestamp)} />
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600 dark:text-slate-400 text-sm">Protocol Stack</span>
            <div className="flex flex-wrap gap-2">
              {frameInfo.protocols.split(':').map((protocol, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    protocol === 'eth' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    protocol === 'ethertype' ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200' :
                    protocol === 'ip' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    protocol === 'tcp' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                    protocol === 'udp' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                    protocol === 'tls' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                    protocol === 'http' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                    protocol === 'https' ? 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200' :
                    protocol === 'dns' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200' :
                    'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {protocol.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </InfoCard>

      {/* Ethernet Layer */}
      <InfoCard title="Ethernet Layer" icon={Link} sectionKey="ethernet">
        <div className="space-y-3">
          <DataField label="Source MAC" value={ethernetInfo.srcMac} highlight />
          <DataField label="Source Vendor" value={ethernetInfo.srcVendor} />
          <DataField label="Destination MAC" value={ethernetInfo.dstMac} highlight />
          <DataField label="Destination Vendor" value={ethernetInfo.dstVendor} />
          <DataField label="EtherType" value={ethernetInfo.type} />
        </div>
      </InfoCard>

      {/* IP Layer */}
      <InfoCard title="Internet Protocol" icon={Globe} sectionKey="ip">
        <div className="space-y-3">
          <DataField label="Source IP" value={ipInfo.srcIp} highlight />
          <DataField label="Destination IP" value={ipInfo.dstIp} highlight />
          <DataField label="Version" value={`IPv${ipInfo.version}`} />
          <DataField label="TTL (Time to Live)" value={`${ipInfo.ttl} hops`} />
          <DataField label="Packet Length" value={`${ipInfo.length} bytes`} />
          <DataField label="Identification" value={ipInfo.id} />
          <DataField label="Flags" value={ipInfo.flags} />
        </div>
      </InfoCard>

      {/* TCP Layer */}
      {(packet.protocol.includes('TCP') || frameInfo.protocols.includes('tcp')) && (
        <InfoCard title="Transmission Control Protocol" icon={Zap} sectionKey="tcp">
          <div className="space-y-3">
            <DataField label="Source Port" value={tcpInfo.srcPort} highlight />
            <DataField label="Destination Port" value={tcpInfo.dstPort} highlight />
            <DataField label="Sequence Number" value={tcpInfo.seq} />
            <DataField label="Acknowledgment Number" value={tcpInfo.ack} />
            <DataField label="Window Size" value={`${tcpInfo.window} bytes`} />
            <DataField label="Stream ID" value={`#${tcpInfo.stream}`} />
            
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 dark:text-slate-400 text-sm">TCP Flags</span>
              <div className="flex flex-wrap gap-2">
                <FlagBadge flag="SYN" active={tcpInfo.flags.includes('SYN')} />
                <FlagBadge flag="ACK" active={tcpInfo.flags.includes('ACK')} />
                <FlagBadge flag="FIN" active={tcpInfo.flags.includes('FIN')} />
                <FlagBadge flag="PSH" active={tcpInfo.flags.includes('PSH')} />
                <FlagBadge flag="RST" active={tcpInfo.flags.includes('RST')} />
                <FlagBadge flag="URG" active={tcpInfo.flags.includes('URG')} />
              </div>
            </div>
          </div>
        </InfoCard>
      )}

      {/* UDP Layer */}
      {(packet.protocol.includes('UDP') || frameInfo.protocols.includes('udp')) && (
        <InfoCard title="User Datagram Protocol" icon={Zap} sectionKey="udp">
          <div className="space-y-3">
            <DataField label="Source Port" value={udpInfo.srcPort} highlight />
            <DataField label="Destination Port" value={udpInfo.dstPort} highlight />
            <DataField label="Length" value={`${udpInfo.length} bytes`} />
            <DataField label="Checksum" value={udpInfo.checksum} />
          </div>
        </InfoCard>
      )}

      {/* Connection Flow Visualization */}
      <InfoCard title="Connection Flow" icon={MapPin} sectionKey="flow">
        <div className="py-4 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 items-center">
            {/* Source */}
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Wifi className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Source</div>
              <div className="text-xs text-slate-500 font-mono mb-1 break-all">
                {ipInfo.srcIp}:{frameInfo.protocols.includes('tcp') ? tcpInfo.srcPort : frameInfo.protocols.includes('udp') ? udpInfo.srcPort : 'N/A'}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {ethernetInfo.srcVendor !== 'Unknown' ? ethernetInfo.srcVendor : ethernetInfo.srcMac}
              </div>
            </div>
            
            {/* Flow Arrow */}
            <div className="flex flex-col items-center order-3 sm:order-2">
              <div className="flex items-center gap-1 mb-2 sm:rotate-0 rotate-90">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
              </div>
              <div className="text-xs font-medium text-slate-600 dark:text-slate-400 text-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                {frameInfo.protocols.includes('tcp') ? (tcpInfo.flags.join(', ') || 'DATA') : packet.protocol}
              </div>
            </div>
            
            {/* Destination */}
            <div className="text-center order-2 sm:order-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Destination</div>
              <div className="text-xs text-slate-500 font-mono mb-1 break-all">
                {ipInfo.dstIp}:{frameInfo.protocols.includes('tcp') ? tcpInfo.dstPort : frameInfo.protocols.includes('udp') ? udpInfo.dstPort : 'N/A'}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {ethernetInfo.dstVendor !== 'Unknown' ? ethernetInfo.dstVendor : ethernetInfo.dstMac}
              </div>
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}