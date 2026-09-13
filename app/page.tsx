"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const devices = [
  { type: "PC", label: "PC-0", icon: "▣", tone: "bg-[#fdf2f2] text-[#e01a1a]" },
  { type: "SW", label: "Switch", icon: "⬡", tone: "bg-[#f1f5f9] text-[#0a0a0a]" },
  { type: "RT", label: "Router", icon: "◈", tone: "bg-[#fef3c7] text-[#d97706]" },
  { type: "SV", label: "Server", icon: "▤", tone: "bg-[#dbeafe] text-[#2563eb]" },
  { type: "AP", label: "Access point", icon: "◉", tone: "bg-[#dcfce7] text-[#16a34a]" },
];

const topologyNodes = [
  { id: "pc0", name: "PC-0", kind: "PC", ip: "192.168.1.10", x: "12%", y: "28%", tone: "border-[#e01a1a] bg-[#fdf2f2] text-[#e01a1a]" },
  { id: "switch0", name: "Switch-0", kind: "SW", ip: "—", x: "43%", y: "50%", tone: "border-[#0a0a0a] bg-white text-[#0a0a0a]" },
  { id: "router0", name: "Router-0", kind: "RT", ip: "192.168.1.1", x: "68%", y: "27%", tone: "border-[#d97706] bg-[#fffbeb] text-[#b45309]" },
  { id: "server0", name: "Web Server", kind: "SV", ip: "192.168.1.20", x: "82%", y: "67%", tone: "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]" },
];

const links = [
  { x1: "19%", y1: "34%", x2: "43%", y2: "52%" },
  { x1: "50%", y1: "48%", x2: "68%", y2: "32%" },
  { x1: "50%", y1: "56%", x2: "82%", y2: "66%" },
];

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState("pc0");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState("1x");
  const [activeTab, setActiveTab] = useState("Topology");
  const selected = topologyNodes.find((node) => node.id === selectedDevice) ?? topologyNodes[0];

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#0a0a0a]">
      <header className="flex h-16 items-center justify-between border-b border-[#0a0a0a] bg-white px-7">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center bg-[#e01a1a] text-lg font-black text-white">N.</span>
            <div>
              <p className="font-heading text-xl font-black tracking-tight">NETLAB</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#718096]">Network learning lab</p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#e2e8f0]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096]">Workspace</p>
            <p className="font-mono-netlab text-sm font-semibold">LAN Fundamentals / 01</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-2">
            <span className="size-2 rounded-full bg-[#16a34a]" />
            <span className="text-xs font-bold uppercase tracking-wider">Host online</span>
          </div>
          <Button variant="secondary" size="sm">Class CS-789K ↗</Button>
          <button aria-label="Open help" className="grid size-9 place-items-center border border-[#cbd5e1] text-sm font-bold transition-colors hover:border-[#e01a1a] hover:text-[#e01a1a]">?</button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] grid-cols-[88px_minmax(0,1fr)_292px]">
        <aside className="border-r border-[#0a0a0a] bg-[#0a0a0a] px-3 py-5 text-white">
          <p className="mb-5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">Devices</p>
          <div className="flex flex-col gap-3">
            {devices.map((device) => (
              <button key={device.type} title={`Add ${device.label}`} className="group flex flex-col items-center gap-2 border border-[#27272a] px-2 py-3 text-center transition-colors hover:border-[#e01a1a]">
                <span className={`grid size-10 place-items-center text-xl ${device.tone}`}>{device.icon}</span>
                <span className="text-[9px] font-semibold leading-tight text-[#cbd5e1] group-hover:text-white">{device.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 border-t border-[#27272a] pt-5 text-center">
            <button className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] hover:text-white">+ Custom</button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex h-14 items-center justify-between border-b border-[#e2e8f0] bg-white px-5">
            <div className="flex items-center gap-1">
              {["Topology", "Exercises", "Classroom"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-4 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? "border-[#e01a1a] text-[#e01a1a]" : "border-transparent text-[#718096] hover:text-[#0a0a0a]"}`}>{tab}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="border border-[#cbd5e1] px-3 py-2 text-xs font-bold hover:border-[#0a0a0a]">↶ Undo</button>
              <button className="border border-[#cbd5e1] px-3 py-2 text-xs font-bold hover:border-[#0a0a0a]">↷ Redo</button>
              <Button size="sm">+ Add PDU</Button>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#e01a1a]">Scenario 01 / Layer 2–3</p>
                <h1 className="font-heading text-4xl font-black tracking-tight">Build a connected LAN<span className="text-[#e01a1a]">.</span></h1>
              </div>
              <p className="max-w-xs text-right text-xs leading-5 text-[#4a5568]">Connect every device, configure IPv4, then verify the route with an ICMP ping.</p>
            </div>

            <div className="netlab-grid relative min-h-[480px] flex-1 overflow-hidden border border-[#0a0a0a] bg-white">
              <div className="absolute left-5 top-4 flex items-center gap-2 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#718096]">⌖ Canvas / live projection</div>
              <div className="absolute right-5 top-4 flex items-center gap-2 border border-[#e2e8f0] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider"><span className="size-2 rounded-full bg-[#16a34a]" /> 3 links up</div>
              <svg className="absolute inset-0 size-full" aria-label="Network links" role="img">
                {links.map((link, index) => <line key={index} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} stroke={index === 1 ? "#e01a1a" : "#0a0a0a"} strokeWidth="2" strokeDasharray={index === 1 ? "7 5" : undefined} />)}
                <circle cx="59%" cy="40%" r="6" fill="#e01a1a"><animate attributeName="cx" values="50%;68%;50%" dur="2.4s" repeatCount="indefinite" /><animate attributeName="cy" values="48%;32%;48%" dur="2.4s" repeatCount="indefinite" /></circle>
              </svg>
              {topologyNodes.map((node) => (
                <button key={node.id} onClick={() => setSelectedDevice(node.id)} className={`node-shadow absolute -translate-x-1/2 -translate-y-1/2 border-2 p-3 text-left transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e01a1a]/30 ${node.tone} ${selectedDevice === node.id ? "ring-2 ring-[#e01a1a] ring-offset-2" : ""}`} style={{ left: node.x, top: node.y }}>
                  <div className="flex items-center gap-2"><span className="grid size-8 place-items-center border border-current bg-white text-sm font-black">{node.kind}</span><span><span className="block text-xs font-black uppercase tracking-wide">{node.name}</span><span className="font-mono-netlab text-[9px] text-[#718096]">{node.ip}</span></span></div>
                  <span className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#16a34a]"><span className="size-1.5 rounded-full bg-[#16a34a]" /> Link up</span>
                </button>
              ))}
              <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 font-mono-netlab text-[10px] text-[#718096]">x: 42.8 / y: 18.2 / zoom: 100%</div>
              <div className="absolute bottom-4 right-4 flex gap-1 border border-[#e2e8f0] bg-white p-1"><button className="grid size-7 place-items-center text-sm hover:bg-[#f1f3f5]">−</button><button className="grid size-7 place-items-center text-sm hover:bg-[#f1f3f5]">+</button><button className="grid size-7 place-items-center text-sm hover:bg-[#f1f3f5]">⛶</button></div>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] border border-[#0a0a0a] bg-[#0a0a0a] text-white">
              <div className="flex items-center gap-5 px-4 py-3"><button aria-label={isPlaying ? "Pause animation" : "Play animation"} onClick={() => setIsPlaying(!isPlaying)} className="grid size-8 place-items-center rounded-full bg-[#e01a1a] text-sm">{isPlaying ? "Ⅱ" : "▶"}</button><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">Packet flow</p><p className="font-mono-netlab text-xs">ICMP Echo Request <span className="text-[#e01a1a]">→</span> Router-0</p></div></div>
              <div className="flex items-center gap-1 border-l border-[#27272a] px-3">{["0.5x", "1x", "2x"].map((option) => <button key={option} onClick={() => setSpeed(option)} className={`px-3 py-2 text-[10px] font-bold ${speed === option ? "bg-white text-[#0a0a0a]" : "text-[#94a3b8] hover:text-white"}`}>{option}</button>)}</div>
            </div>
          </div>
        </section>

        <aside className="border-l border-[#0a0a0a] bg-white">
          <div className="border-b border-[#0a0a0a] px-5 py-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#718096]">Inspector</p><h2 className="mt-1 font-heading text-2xl font-black">{selected.name}</h2><p className="font-mono-netlab text-[10px] text-[#e01a1a]">DEVICE / {selected.kind}</p></div>
          <div className="border-b border-[#e2e8f0] p-5"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#718096]">IPv4 configuration</p><label className="mb-2 block text-xs font-bold">IP address</label><input value={selected.ip === "—" ? "" : selected.ip} readOnly placeholder="Not configured" className="mb-4 h-10 w-full border border-[#cbd5e1] bg-[#f8f9fa] px-3 font-mono-netlab text-xs outline-none focus:border-[#e01a1a] focus:ring-2 focus:ring-[#e01a1a]/20" /><label className="mb-2 block text-xs font-bold">Subnet mask</label><input value="255.255.255.0" readOnly className="h-10 w-full border border-[#cbd5e1] bg-[#f8f9fa] px-3 font-mono-netlab text-xs outline-none" /></div>
          <div className="border-b border-[#e2e8f0] p-5"><div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Connection status</p><span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#16a34a]"><span className="size-2 rounded-full bg-[#16a34a]" /> UP</span></div><div className="flex items-center justify-between border-b border-[#e2e8f0] py-2 text-xs"><span className="text-[#718096]">Port</span><span className="font-mono-netlab font-semibold">FastEthernet 0/1</span></div><div className="flex items-center justify-between py-2 text-xs"><span className="text-[#718096]">Gateway</span><span className="font-mono-netlab font-semibold">192.168.1.1</span></div></div>
          <div className="p-5"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#718096]">Event log</p><div className="flex flex-col gap-3 font-mono-netlab text-[10px]"><p><span className="text-[#718096]">12:04:10</span> <span className="text-[#16a34a]">OK</span> Link established</p><p><span className="text-[#718096]">12:04:12</span> <span className="text-[#e01a1a]">SEND</span> ICMP packet 01</p><p><span className="text-[#718096]">12:04:13</span> <span className="text-[#16a34a]">OK</span> Reply received · 2 hops</p></div></div>
        </aside>
      </div>
    </main>
  );
}
