import streamlit as st
import pandas as pd
import time
from datetime import datetime
from liquidations import LiquidationEngine
from ui_layout import render_sentinel_dashboard

st.set_page_config(page_title="DEX Sentinel", layout="wide")

if 'engine' not in st.session_state: st.session_state.engine = LiquidationEngine()
if 'dex_history' not in st.session_state: st.session_state.dex_history = pd.DataFrame(columns=['symbol', 'side', 'price', 'origQty', 'time'])
if 'dex_audit' not in st.session_state: st.session_state.dex_audit = pd.DataFrame(columns=['Timestamp', 'Asset', 'Price', 'Status'])
if 'dex_last_prices' not in st.session_state: st.session_state.dex_last_prices = {}

symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']
dashboard_spot = st.empty()

while True:
    data = st.session_state.engine.get_market_data(symbols, "DEX")
    rekt = st.session_state.engine.get_rekt_feed("DEX")
    bids, asks = st.session_state.engine.get_liquidity_depth(symbols[0], "DEX")
    magnets = st.session_state.engine.get_liquidity_magnets(symbols[0], data[symbols[0]]['price'], "DEX")
    cvd = st.session_state.engine.get_cvd_series(symbols[0], "DEX")

    # Update audit logs for the DEX feed
    for s in symbols:
        p = data[s]['price']
        v_status = "STABLE"
        if st.session_state.dex_last_prices.get(s) and abs((p - st.session_state.dex_last_prices[s])/st.session_state.dex_last_prices[s]) > 0.0001:
            v_status = "!! VOLATILE !!"
        
        new_log = {'Timestamp': datetime.now().strftime('%H:%M:%S'), 'Asset': s, 'Price': f"${p:,.2f}", 'Status': v_status}
        st.session_state.dex_audit = pd.concat([pd.DataFrame([new_log]), st.session_state.dex_audit]).head(20)
    
    if not rekt.empty:
        st.session_state.dex_history = pd.concat([rekt, st.session_state.dex_history]).drop_duplicates(subset=['time', 'price']).head(50)

    with dashboard_spot.container():
        render_sentinel_dashboard("DEX Sentinel | Hyperliquid", "DEX", symbols, data, rekt, bids, asks, magnets, cvd, 'dex_history', 'dex_audit', st.session_state.dex_last_prices)
    
    time.sleep(2)