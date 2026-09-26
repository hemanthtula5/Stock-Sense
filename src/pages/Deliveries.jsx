import OperationList from '../components/OperationList';
import { ArrowUp } from '@phosphor-icons/react';

export default function Deliveries() {
  return (
    <OperationList
      type="delivery"
      title="Deliveries"
      icon={ArrowUp}
      createPath="/deliveries/new"
      detailPath="/deliveries"
    />
  );
}
