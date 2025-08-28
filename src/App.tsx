import * as React from 'react';
import ChatIcon from '@mui/icons-material/Chat';
import { Outlet } from 'react-router';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import type { Navigation } from '@toolpad/core/AppProvider';

const NAVIGATION: Navigation = [
  {
    segment: 'manager-chat',
    title: 'Manager Chat',
    icon: <ChatIcon />,
    pattern: 'manager-chat',
  },
];

const BRANDING = {
  title: 'My Toolpad Core App',
};

export default function App() {
  return (
    <ReactRouterAppProvider navigation={NAVIGATION} branding={BRANDING}>
      <Outlet />
    </ReactRouterAppProvider>
  );
}
