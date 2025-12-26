# Crossed

## Overview

Crossed is a mobile dating application designed to foster organic connections through shared real-world locations. Unlike traditional digital dating platforms that rely primarily on superficial swiping mechanics, Crossed grounds its matching algorithm in physical reality, connecting individuals who have crossed paths or frequent the same environments.

## Purpose

The primary objective of this application is to restore intentionality to modern dating. By leveraging location history and shared spaces as the foundation for connection, Crossed aims to bridge the gap between digital discovery and physical presence. The platform validates compatibility through shared lifestyle patterns and real-world proximity, facilitating introductions that feel more natural and less stochastic than standard algorithmic matching.

## Differentiation

Crossed distinguishes itself from competitors through its core architectural philosophy:

*   **Contextual Matching:** Connections are derived from shared physical contexts—cafes, parks, workspaces, and neighborhoods. This ensures that users already share a common ground before the first conversation begins.
*   **Privacy-First Geofencing:** Rather than continuous, invasive tracking, the application utilizes sophisticated geofencing around specific points of interest. This approach respects user privacy while accurately identifying meaningful overlaps in daily routines.
*   **Organic Discovery:** The application mimics the serendipity of meeting someone in the real world. Matches are presented not just based on visual appeal, but on the probability of compatible lifestyles as evidenced by location data.

## Technology Stack

The technical architecture of Crossed was selected to prioritize performance, scalability, and developer velocity.

### Frontend: React Native (Expo)
We utilize React Native (Expo) to deliver a high-performance, cross-platform mobile experience. This allows for a unified codebase that deploys natively to both iOS and Android while maintaining the fluidity and responsiveness expected of modern mobile applications.

### Styling: NativeWind
The user interface is constructed using NativeWind, bringing the utility-first methodology of Tailwind CSS to the React Native environment. This ensures a consistent design system, rapid UI iteration, and highly maintainable style definitions.

### Backend: Convex
Convex serves as the comprehensive backend-as-a-service (BaaS) infrastructure. It was chosen for its:
*   **Real-time Capabilities:** Enabling instant messaging and live updates without the overhead of managing WebSocket servers.
*   **End-to-End Type Safety:** Deep integration with TypeScript ensures data consistency from the database schema directly to the frontend components.
*   **Serverless Architecture:** Eliminating the need for traditional server maintenance and scaling operations.

### Authentication: Clerk
Clerk is integrated to manage secure user authentication and session handling, providing a robust and compliant identity layer for the platform.

### Maps & Geolocation: React Native Maps
The application leverages `react-native-maps` for rendering interactive map interfaces, essential for the location-based discovery features that define the user experience.
