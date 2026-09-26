import OperationList from '../components/OperationList';
import { ArrowDown } from '@phosphor-icons/react';

export default function Receipts() {
  return (
    <OperationList
      type="receipt"
      title="Receipts"
      icon={ArrowDown}
      createPath="/receipts/new"
      detailPath="/receipts"
    />
  );
}
