import { createContext } from 'react'

/* App-wide intents + cart state — shared so any screen/component can consume
   them once extracted from App.jsx (A5.1) */
export const QtyCtx = createContext(null)        // open the bulk qty sheet
export const PdpCtx = createContext(null)        // open a product page
export const CartCtx = createContext(null)       // open the cart
export const CartItemsCtx = createContext({})    // live cart lines (source of truth)
