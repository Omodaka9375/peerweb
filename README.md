# 🪐 PeerWeb 🪐 


**🌏 Decentralized website hosting powered by WebTorrent 🌏** 

[PeerWeb](https://peerweb.lol) enables truly decentralized, censorship-resistant website hosting through peer-to-peer networks. Upload your static websites and share them globally without relying on centralized servers or paying hosting fees.

<img width="1356" height="957" alt="image" src="https://github.com/user-attachments/assets/9b47f09d-e2ca-4b82-a936-ff8445d8a4fa" />

## Link demos

- **Main Page** - [https://peerweb.lol](https://peerweb.lol)

- **Functionality Demo with local resources** - [https://peerweb.lol/?orc=90c020bd252639622a14895a0fad713b91e0130c](https://peerweb.lol/?orc=90c020bd252639622a14895a0fad713b91e0130c)

- **SomaFM on PeerWeb** - [https://peerweb.lol/?orc=908d19242ae1461f333a516d1f8b89c13ef2d259](https://peerweb.lol/?orc=908d19242ae1461f333a516d1f8b89c13ef2d259)
  
- **Chess on PeerWeb** - [https://peerweb.lol/?orc=525bad84c4637cc49b47e3b9a5e3e9bd6a6dc398](https://peerweb.lol/?orc=525bad84c4637cc49b47e3b9a5e3e9bd6a6dc398) 

- **Text Editor app on PeerWeb** - [https://peerweb.lol/?orc=4e5f1204dcec68195bfcc89f9410a0b70a0ddfac](https://peerweb.lol/?orc=4e5f1204dcec68195bfcc89f9410a0b70a0ddfac)

- **Markdown Editor on PeerWeb** - [https://peerweb.lol/?orc=59587ae54c2cc2cf1b0419728ab5625fd7c54fdf](https://peerweb.lol/?orc=59587ae54c2cc2cf1b0419728ab5625fd7c54fdf) 

## ✨ Features

### 🚀 Core Features
- **Drag & Drop Upload** - Simply drag your website folder
- **Instant Sharing** - Get a shareable PeerWeb link immediately
- **Zero Hosting Costs** - No servers, no monthly fees, completely free
- **Censorship Resistant** - Distributed across peer-to-peer networks
- **Always Available** - Works as long as there are online peers

### 💾 Smart Technology
- **Intelligent Caching** - Lightning-fast loading with IndexedDB storage
- **Service Worker Magic** - Seamless resource loading and offline support
- **Progress Tracking** - Real-time download progress and peer statistics
- **Auto Cleanup** - Expired cache automatically cleaned after 7 days

### 🛡️ Security & Safety
- **XSS Protection** - All HTML sanitized with DOMPurify
- **Sandboxed Execution** - Sites run in isolated iframe environments
- **Content Validation** - All resources validated before display
- **External Link Preservation** - Social media and external links work normally

### 🎯 User Experience
- **Quick Upload Interface** - Prominent drag-and-drop area
- **Advanced Torrent Creator** - Full-featured torrent creation tools
- **Debug Mode** - Detailed logging for developers and troubleshooting
- **Mobile Friendly** - Responsive design works on all devices

## 🚀 Quick Start

### 1. Host a Website
1. Open [PeerWeb.lol](https://peerweb.lol) in your browser
2. Drag your website folder to the upload area
3. Get your unique PeerWeb URL, and keep the tab open
4. Share the link with anyone, anywhere!

### 2. Load a Website
1. Enter a torrent hash in the load field
2. Or use a PeerWeb URL: `https://peerweb.lol?orc=HASH`
3. Website loads directly from the peer network

### 3. Debug & Develop
Add `&debug=true` to any PeerWeb URL for detailed logging:
```
https://peerweb.lol?orc=ABC123...&debug=true
```

## 📋 Website Requirements

Your websites should be:
- ✅ **Static content only** (HTML, CSS, JS, images, fonts, etc.)
- ✅ **Include index.html** (in root)
- ✅ **Use relative paths** for all internal resources
- ✅ **Responsive design** recommended for best experience

## 🏗️ Project Structure

```
peerweb/
├── index.html          # Main application interface
├── styles.css          # Application styling
├── peerweb.js          # Core PeerWeb functionality
├── peerweb.min.js      # Minified version
├── peerweb-sw.js       # Service Worker for resource handling
└── README.md           # This file
```

## 🌐 How It Works

### The Magic Behind PeerWeb

1. **Upload Process**
   - Your website files are packaged into a BitTorrent torrent
   - A unique hash identifies your site across the network
   - Files are seeded from your browser to the peer network

2. **Loading Process**
   - Service Worker intercepts resource requests
   - Files are downloaded via WebTorrent from multiple peers
   - Content is cached locally for instant future access

3. **Security Layer**
   - All HTML content sanitized with DOMPurify
   - Sites run in sandboxed iframe
   - External links preserved and functional

## 🚀 Advanced Usage

### Debug Mode
Enable detailed logging by adding `&debug=true` to any URL:
```javascript
// Example debug output
[PeerWeb] Loading site with hash: abc123...
[PeerWeb] Found 15 files in torrent
[PeerWeb] Processing site early (95% complete)
[PeerWeb SW] Serving file: styles.css (2.4KB)
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Report Bugs
- Use the [Issues](https://github.com/Omodaka9375/peerweb/issues) tab
- Include browser version, steps to reproduce, and error messages
- Enable debug mode for detailed logs

### 💡 Suggest Features
- Open a [Feature Request](https://github.com/Omodaka9375/peerweb/issues/new)
- Describe the use case and expected behavior
- Check existing issues to avoid duplicates

### 🔧 Submit Code
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a Pull Request with detailed description

### 📝 Improve Documentation
- Fix typos or unclear instructions
- Add examples and use cases
- Translate to other languages

## 📖 Documentation

### Browser Support
- ✅ **Chrome/Chromium** 60+ (Recommended)
- ✅ **Firefox** 55+
- ✅ **Safari** 11+
- ✅ **Edge** 79+
- ❌ Internet Explorer (Not supported)

### WebTorrent Compatibility
- Uses WebTorrent for browser-based torrenting
- Compatible with standard BitTorrent protocol
- Supports DHT, PEX, and WebRTC connections

### Limitations
- **Static sites only** - No server-side processing
- **Browser hosting** - Sites available while browser tab is open
- **Peer dependency** - Requires active peers for availability
- **Large files** - May be slow for sites with many large assets

## 🔒 Security

### Content Sanitization
All HTML content is automatically sanitized using DOMPurify to prevent:
- Cross-site scripting (XSS) attacks
- Malicious script injection
- Dangerous HTML elements and attributes

### Sandboxed Execution
Websites run in sandboxed iframes with restrictions:
```html
<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals">
```

### External Resource Handling
- External links (social media, email, etc.) work normally
- CDN resources and external stylesheets load properly
- Only internal site resources are processed through PeerWeb

## 🌟 Use Cases

### 📝 Personal Websites
- Portfolio sites
- Blogs and documentation
- Landing pages
- Resume/CV sites

### 🎨 Creative Projects
- Art galleries
- Photography portfolios
- Interactive demos
- Games and experiments

### 📚 Educational Content
- Course materials
- Tutorials and guides
- Research publications
- Student projects

### 🌍 Censorship Resistance
- News and journalism
- Political content
- Whistleblowing platforms
- Freedom of speech tools

## 🏆 Desktop Clients

For permanent hosting without keeping browser tabs open:

- 🪟 **Windows** - PeerWeb Desktop (Coming Soon)
- 🍎 **macOS** - PeerWeb Desktop (Coming Soon)  
- 🐧 **Linux** - PeerWeb Desktop (Coming Soon)

## 📊 Technical Specifications

### Supported File Types
- **Documents**: HTML, CSS, JavaScript, JSON, XML
- **Images**: PNG, JPEG, GIF, SVG, WebP, ICO
- **Fonts**: WOFF, WOFF2, TTF, OTF, EOT
- **Media**: MP4, WebM, MP3, WAV
- **Other**: PDF and various binary formats

### Performance
- **Caching**: IndexedDB with 7-day expiration
- **Loading**: Progressive loading with 95% threshold
- **Piece Size**: Optimized based on total site size
- **Timeout**: 5-second request timeout with fallbacks

### Network
- **Trackers**: 7+ built-in BitTorrent trackers
- **Protocols**: WebRTC, WebSocket, HTTP fallback
- **DHT**: Distributed Hash Table support
- **PEX**: Peer Exchange for discovery

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[WebTorrent](https://webtorrent.io/)** - Browser-based BitTorrent implementation
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - XSS sanitizer for HTML
- **BitTorrent Protocol** - Peer-to-peer file sharing foundation
- **Service Workers** - Enabling offline-first web applications

## 📞 Support

### Getting Help
- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Bug Reports**: Use GitHub Issues with debug logs
- 💬 **Community**: Join discussions in GitHub Discussions
- 📧 **Contact**: Create an issue for direct support

### Frequently Asked Questions

**Q: How long do sites stay available?**
A: Sites remain available as long as at least one peer is seeding them.

**Q: Can I update my website?**
A: Create a new torrent for updates. The hash will change with new content.

**Q: Is there a file size limit?**
A: No hard limits, but larger sites may load slower due to peer availability.

**Q: Can I use custom domains?**
A: Yes! Deploy PeerWeb to your domain and use `?orc=HASH` parameters.

**Q: Does it work offline?**
A: Cached sites work offline. New sites require internet for initial download.

---

<div align="center">

**🌟 Star this project if you find it useful! 🌟**

Made with ❤️ for the decentralized web

</div>
