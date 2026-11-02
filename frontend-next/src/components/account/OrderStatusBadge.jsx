import { getOrderStatus } from '../../constants/orderStatus';

export default function OrderStatusBadge({ status, className = 'px-3 py-0.5 text-xs' }) {
  const { label, color } = getOrderStatus(status);
  return <span className={`rounded-full font-bold ${color} ${className}`}>{label}</span>;
}
