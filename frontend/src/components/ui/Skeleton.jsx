export default function Skeleton({ className = '', style }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} style={style} />;
}
