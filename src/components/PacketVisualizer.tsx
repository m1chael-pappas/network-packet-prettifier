'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Network, Clock, Info } from 'lucide-react';
import { PacketParseResult } from '@/lib/packetParser';
import { PacketPagination } from './PacketPagination';
import { PacketDetails } from './PacketDetails';
import { PacketSearch } from './PacketSearch';

interface PacketVisualizerProps {
  parseResult: PacketParseResult;
}

const PACKETS_PER_PAGE = 20;

export function PacketVisualizer({ parseResult }: PacketVisualizerProps) {
  const [selectedPacket, setSelectedPacket] = useState<number | null>(null);
  const [expandedPackets, setExpandedPackets] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('all');

  // Filter packets based on search query and protocol filter
  const filteredPackets = useMemo(() => {
    let filtered = parseResult.packets;

    // Apply protocol filter
    if (protocolFilter !== 'all') {
      filtered = filtered.filter(packet => 
        packet.protocol.toLowerCase().includes(protocolFilter.toLowerCase())
      );
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(packet => 
        packet.source.toLowerCase().includes(query) ||
        packet.destination.toLowerCase().includes(query) ||
        packet.protocol.toLowerCase().includes(query) ||
        packet.info.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [parseResult.packets, searchQuery, protocolFilter]);

  const totalPages = Math.ceil(filteredPackets.length / PACKETS_PER_PAGE);
  
  const paginatedPackets = useMemo(() => {
    const startIndex = (currentPage - 1) * PACKETS_PER_PAGE;
    const endIndex = startIndex + PACKETS_PER_PAGE;
    return filteredPackets.slice(startIndex, endIndex);
  }, [filteredPackets, currentPage]);

  const handleSearch = (query: string, filter: string) => {
    setSearchQuery(query);
    setProtocolFilter(filter);
    setCurrentPage(1); // Reset to first page when searching
    setSelectedPacket(null);
    setExpandedPackets(new Set());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPacket(null);
    setExpandedPackets(new Set());
  };

  const togglePacketExpansion = (index: number) => {
    const newExpanded = new Set(expandedPackets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedPackets(newExpanded);
  };

  const getProtocolColor = (protocol: string): string => {
    switch (protocol.toUpperCase()) {
      case 'TCP': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'UDP': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
      case 'ICMP': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      case 'HTTP': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'HTTPS': return 'bg-gradient-to-r from-violet-500 to-violet-600 text-white';
      case 'DNS': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'ARP': return 'bg-gradient-to-r from-pink-500 to-pink-600 text-white';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    }
  };

  if (parseResult.packets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-slate-500/20 rounded-full blur-xl"></div>
          <Network className="relative mx-auto h-16 w-16 text-slate-400 mb-4" />
        </div>
        <p className="text-slate-500">No packets could be parsed from the provided data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-xl border border-blue-200 dark:border-blue-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Network className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Packet Analysis
            </h3>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono">
            <span className="bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-full">
              {parseResult.format.toUpperCase()}
            </span>
            <span className="mx-2">•</span>
            <span className="bg-slate-100 dark:bg-slate-800 px-2 sm:px-3 py-1 rounded-full">
              {parseResult.totalPackets} packets
            </span>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <PacketSearch 
        onSearch={handleSearch}
        totalPackets={parseResult.totalPackets}
        filteredCount={filteredPackets.length}
      />

      <div className="space-y-3">
        {filteredPackets.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-slate-500/20 rounded-full blur-xl"></div>
              <Network className="relative mx-auto h-16 w-16 text-slate-400 mb-4" />
            </div>
            <p className="text-slate-500">No packets match your search criteria.</p>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your search or filter settings.</p>
          </div>
        ) : (
          paginatedPackets.map((packet, index) => (
          <div
            key={index}
            className={`border rounded-xl transition-all duration-300 backdrop-blur-sm ${
              selectedPacket === index
                ? 'border-blue-400 shadow-lg shadow-blue-500/25'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div
              className={`p-4 sm:p-6 cursor-pointer transition-all duration-200 ${
                selectedPacket === index 
                  ? 'bg-blue-50/50 dark:bg-blue-900/20' 
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
              onClick={() => {
                setSelectedPacket(selectedPacket === index ? null : index);
                togglePacketExpansion(index);
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      #{(currentPage - 1) * PACKETS_PER_PAGE + index + 1}
                    </span>
                    <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full ${getProtocolColor(packet.protocol)}`}>
                      {packet.protocol}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-sm">
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">
                      {packet.source}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                      <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                    </div>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm truncate">
                      {packet.destination}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {packet.length > 0 && (
                      <span className="text-xs sm:text-sm text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {packet.length} bytes
                      </span>
                    )}
                    {packet.timestamp && (
                      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {packet.timestamp}
                      </div>
                    )}
                  </div>
                  <div className="p-2 rounded-lg transition-colors">
                    {expandedPackets.has(index) ? (
                      <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {packet.info && (
                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-3">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                  <span className="break-all leading-relaxed">{packet.info}</span>
                </div>
              )}
            </div>

            {expandedPackets.has(index) && (
              <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-sm">
                <div className="p-6">
                  <PacketDetails packet={packet} />
                </div>
              </div>
            )}
          </div>
          ))
        )}
      </div>
      
      <PacketPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalPackets={filteredPackets.length}
        packetsPerPage={PACKETS_PER_PAGE}
        onPageChange={handlePageChange}
      />
    </div>
  );
}