'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download } from 'lucide-react';
import { parsePacketData, PacketParseResult } from '@/lib/packetParser';
import { PacketVisualizer } from '@/components/PacketVisualizer';

interface PacketData {
  filename: string;
  content: string;
  parsed?: PacketParseResult;
}

export default function Home() {
  const [packetData, setPacketData] = useState<PacketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/octet-stream': ['.pcap', '.pcapng'],
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setIsLoading(true);
        const file = acceptedFiles[0];
        try {
          const text = await file.text();
          
          // Add a small delay to show loading state for large files
          if (text.length > 100000) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const parsed = parsePacketData(text);
          setPacketData({
            filename: file.name,
            content: text,
            parsed,
          });
        } catch (error) {
          console.error('Error reading file:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
  });

  const handlePasteContent = async (event: React.ClipboardEvent) => {
    const pastedText = event.clipboardData.getData('text');
    if (pastedText.trim()) {
      setIsLoading(true);
      
      // Add a small delay to show loading state for large content
      if (pastedText.length > 100000) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      try {
        const parsed = parsePacketData(pastedText);
        setPacketData({
          filename: 'pasted-content.txt',
          content: pastedText,
          parsed,
        });
      } catch (error) {
        console.error('Error parsing pasted content:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const exportData = (format: string) => {
    if (!packetData) return;
    
    let content = packetData.content;
    let mimeType = 'text/plain';
    
    if (format === 'json' && packetData.parsed) {
      content = JSON.stringify(packetData.parsed, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv' && packetData.parsed) {
      content = convertToCsv(packetData.parsed);
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${packetData.filename.split('.')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCsv = (parseResult: PacketParseResult): string => {
    const headers = ['Protocol', 'Source', 'Destination', 'Length', 'Info', 'Timestamp'];
    const rows = parseResult.packets.map(packet => [
      packet.protocol,
      packet.source,
      packet.destination,
      packet.length.toString(),
      packet.info,
      packet.timestamp || ''
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-gray-950 dark:via-slate-900 dark:to-zinc-900">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-4 sm:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white rounded-lg rotate-45"></div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-gray-800 to-zinc-900 dark:from-white dark:via-gray-100 dark:to-zinc-100 bg-clip-text text-transparent mb-4 sm:mb-6">
            Network Packet Prettifier
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
            Advanced packet analysis with modern visualization. Upload captures or paste data to decode network traffic.
          </p>
        </div>

        {!packetData ? (
          <div className="max-w-3xl mx-auto">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-16 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <input {...getInputProps()} />
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                <Upload className="relative mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-400 dark:text-slate-500 mb-4 sm:mb-6" />
              </div>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">Processing file...</p>
                </div>
              ) : isDragActive ? (
                <p className="text-lg sm:text-xl text-blue-600 dark:text-blue-400 font-medium">Drop the file here...</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-medium">
                    Drag & drop packet files here, or click to select
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    .pcap • .pcapng • .txt • .json • .csv
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-8 sm:mt-12 p-4 sm:p-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-slate-900 dark:text-white">
                Or paste packet data directly
              </h3>
              <textarea
                className="w-full h-32 sm:h-40 p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700/70 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-all duration-200 text-sm sm:text-base"
                placeholder="Paste your packet data here..."
                onPaste={handlePasteContent}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                      {packetData.filename}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-mono">
                      {packetData.parsed?.totalPackets || 0} packets analyzed
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => exportData('txt')}
                    className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">TXT</span>
                  </button>
                  <button
                    onClick={() => exportData('json')}
                    className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">JSON</span>
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">CSV</span>
                  </button>
                  <button
                    onClick={() => setPacketData(null)}
                    className="px-3 sm:px-6 py-2 sm:py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 text-sm sm:text-base"
                  >
                    <span className="font-medium">Clear</span>
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {packetData.parsed && (
                  <PacketVisualizer parseResult={packetData.parsed} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
