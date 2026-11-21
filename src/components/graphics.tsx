export function AxGraphic() {
  const rings: [number, number, string, string][] = [
    [110, 96, "AI · DATA", "산업AI·데이터"],
    [350, 96, "CONTROL · ROBOT", "제조설비 자동화"],
    [230, 342, "FACTORY · PBL", "현장문제 해결"],
  ];
  return (
    <svg className="ax" viewBox="0 0 460 400" role="img" aria-label="산업AX전공 3대 양성역량">
      <defs>
        <linearGradient id="g1" x1="0" x2="1"><stop offset="0" stopColor="#12B5C9" /><stop offset="1" stopColor="#2F6BFF" /></linearGradient>
      </defs>
      <g fill="none" stroke="#ffffff" strokeOpacity=".25" strokeWidth="1.5">
        <path d="M110 110 C170 150 190 170 230 200" /><path d="M350 110 C290 150 270 170 230 200" /><path d="M230 345 L230 245" />
      </g>
      <circle cx="230" cy="200" r="64" fill="url(#g1)" />
      <text x="230" y="195" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">산업AX</text>
      <text x="230" y="220" textAnchor="middle" fill="#E6F4FF" fontSize="12" fontWeight="600">미래모빌리티 트랙</text>
      {rings.map(([x, y, a, b]) => (
        <g key={a}>
          <circle cx={x} cy={y} r="50" fill="#ffffff10" stroke="#ffffff40" />
          <text x={x} y={y - 4} textAnchor="middle" fill="#9FE6F0" fontSize="11" fontWeight="800" letterSpacing="1">{a}</text>
          <text x={x} y={y + 16} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{b}</text>
        </g>
      ))}
    </svg>
  );
}

export function Circuit() {
  return (
    <svg className="circuit" preserveAspectRatio="none" viewBox="0 0 1400 560" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const y = 30 + i * 38, x = 200 + ((i * 37) % 300);
        return (
          <g key={i}>
            <path d={`M0 ${y} H${x} l20 20 H1400`} stroke="#9DB8FF" fill="none" />
            <circle cx={x + 20} cy={y + 20} r="3" fill="#9DB8FF" />
          </g>
        );
      })}
    </svg>
  );
}
