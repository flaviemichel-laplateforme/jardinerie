export default function Skeleton({ className = '', style }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className}`} style={style} />;
}
