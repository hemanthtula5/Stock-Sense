import OperationDetail from '../components/OperationDetail';

export default function ReceiptDetail() {
  return (
    <OperationDetail
      type="receipt"
      title="Receipt"
      listPath="/receipts"
    />
  );
}
