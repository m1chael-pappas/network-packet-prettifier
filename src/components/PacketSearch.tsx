'use client';

import { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface PacketSearchProps {
  onSearch: (query: string, filter: string) => void;
  totalPackets: number;
  filteredCount: number;
}

export function PacketSearch({ onSearch, totalPackets, filteredCount }: PacketSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleSearch = (query: string, filter: string) => {
    setSearchQuery(query);
    setSelectedFilter(filter);
    onSearch(query, filter);
  };

  const clearSearch = () => {
    handleSearch('', 'all');
  };

  const protocols = [
    { value: 'all', label: 'All Protocols' },
    { value: 'tcp', label: 'TCP' },
    { value: 'udp', label: 'UDP' },
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' },
    { value: 'dns', label: 'DNS' },
    { value: 'icmp', label: 'ICMP' },
    { value: 'arp', label: 'ARP' },
  ];

  return (
    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search packets by IP, port, or content..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value, selectedFilter)}
            className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700/70 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Protocol Filter */}
        <div className="relative w-full sm:w-auto">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedFilter}
            onChange={(e) => handleSearch(searchQuery, e.target.value)}
            className="w-full sm:min-w-[150px] pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700/70 dark:text-white bg-white appearance-none cursor-pointer text-sm sm:text-base"
          >
            {protocols.map(protocol => (
              <option key={protocol.value} value={protocol.value}>
                {protocol.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results Info */}
      {(searchQuery || selectedFilter !== 'all') && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {filteredCount === totalPackets ? (
              `Showing all ${totalPackets} packets`
            ) : (
              `Showing ${filteredCount} of ${totalPackets} packets`
            )}
          </span>
          {(searchQuery || selectedFilter !== 'all') && (
            <button
              onClick={clearSearch}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium self-start sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}