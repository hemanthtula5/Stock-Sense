import OperationList from '../components/OperationList';
import { ArrowsLeftRight } from '@phosphor-icons/react';

export default function Transfers() {
  return (
    <OperationList
      type="internal"
      title="Internal Transfers"
      icon={ArrowsLeftRight}
      createPath="/transfers/new"
      detailPath="/transfers"
    />
  );
}
