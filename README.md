# MessHub - Kitchen Management Platform

MessHub is a comprehensive kitchen management platform designed to help mess owners efficiently manage their operations.

## Progressive Web App (PWA) Features

MessHub is implemented as a Progressive Web App, providing an app-like experience with the following features:

### Key PWA Features

- **Offline Functionality**: Access key features even without an internet connection
- **Installable**: Add to home screen on mobile devices or desktop
- **Fast Loading**: Optimized for quick startup and navigation
- **Push Notifications**: Stay updated with important alerts
- **Background Sync**: Changes made offline are synchronized when back online

### Technical Implementation

- **Service Worker**: Handles caching, offline functionality, and push notifications
- **Web App Manifest**: Enables installation and customizes the app appearance
- **Responsive Design**: Adapts to all device sizes for optimal user experience
- **Caching Strategies**: Different strategies for various resource types
- **HTTPS**: Secure connection required for PWA features

## Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/messhub.git
   cd messhub
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## PWA Testing Guide

### Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to the Lighthouse tab
3. Select "Mobile" device
4. Check "Progressive Web App" category
5. Click "Generate report"
6. Verify score is above 90

### Offline Testing

1. Open the application in Chrome
2. Open DevTools > Application > Service Worker
3. Check "Offline" checkbox
4. Refresh the page
5. Verify the offline page or cached content is displayed
6. Navigate to different sections to test offline functionality

### Installation Testing

1. Desktop:
   - Look for the install icon in the address bar
   - Click and follow installation prompts
   - Verify the app launches as a standalone window

2. Android:
   - Open Chrome menu (three dots)
   - Select "Add to Home Screen"
   - Follow the prompts
   - Verify app icon appears on home screen

3. iOS (Safari):
   - Tap the Share button
   - Select "Add to Home Screen"
   - Tap "Add"
   - Verify app icon appears on home screen

### Cross-Browser Testing

Test the PWA in the following browsers:
- Chrome (Desktop & Mobile)
- Safari (iOS)
- Firefox
- Edge

### Performance Testing

1. Open Chrome DevTools > Network tab
2. Enable throttling to "Slow 3G"
3. Reload the page
4. Verify loading time is under 3 seconds
5. Check for any failed resource loads

## Build for Production

```bash
npm run build
npm start
```

## License

[MIT](LICENSE)
