# Network Packet Prettifier

A modern web application for visualizing and prettifying network packet data. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Drag & Drop Interface**: Easy file upload with support for multiple packet formats
- 📝 **Paste Support**: Directly paste packet data from clipboard
- 🔍 **Smart Parsing**: Automatically detects and parses various packet formats:
  - Wireshark exports
  - tcpdump output
  - JSON packet data
  - CSV format
  - Generic text formats
- 🔎 **Advanced Search**: Search packets by IP, port, protocol, or content with real-time filtering
- 🎨 **Beautiful Visualization**: Clean, modern interface with protocol color coding
- 📊 **Detailed View**: Expandable packet details with all metadata
- 📄 **Pagination**: Efficient handling of large datasets (84k+ packets)
- 📤 **Export Options**: Export parsed data in multiple formats (TXT, JSON, CSV)
- 📱 **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- 🌙 **Dark Mode**: Automatic dark/light theme support

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd network-packet-prettifier
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Deploy with zero configuration

The project includes a `vercel.json` configuration file optimized for Next.js deployment.

## Supported Formats

- **Wireshark**: Standard Wireshark text exports
- **tcpdump**: Command-line packet capture output
- **JSON**: Structured packet data
- **CSV**: Comma-separated packet information
- **Generic**: Plain text with automatic field detection

## Usage

1. **Upload Files**: Drag and drop packet capture files or use the file picker
2. **Paste Data**: Copy packet data from other tools and paste directly
3. **View Details**: Click on packets to expand detailed information
4. **Export**: Download parsed data in your preferred format

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Components**: Lucide React icons
- **File Handling**: React Dropzone
- **Build Tool**: pnpm

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
