import OperationDetail from '../components/OperationDetail';

export default function AdjustmentDetail() {
  return (
    <OperationDetail
      type="adjustment"
      title="Stock Adjustment"
      listPath="/adjustments"
    />
  );
}
