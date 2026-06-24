import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './App.jsx'
import HomePage from './pages/home/index.jsx'

/* App routes. RootLayout owns the global state, contexts and persistent chrome
   (header, nav, cart bar, overlays); routed pages render inside its <Outlet>.
   Pages migrate from the legacy overlay/hash system to real paths one at a time —
   Home is the first. Until a page has its own route, its overlay still opens via
   state in RootLayout, so any path safely falls back to the home shell. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <HomePage /> },
    ],
  },
])
