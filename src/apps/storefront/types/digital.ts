export interface DigitalDelivery {
  type: 'link' | 'codes';
  status: 'ready' | 'awaiting_payment' | 'cancelled';
  values: ReadonlyArray<string>;
}
