import OperationDetail from '../components/OperationDetail';

export default function TransferDetail() {
  return (
    <OperationDetail
      type="internal"
      title="Internal Transfer"
      listPath="/transfers"
    />
  );
}
