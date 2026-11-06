import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVICE_BOOKING_HISTORY_KEY,
  normalizeBookingPhone,
  isCompleteBookingPhone,
  rememberDeviceBooking,
  readDeviceBookingHistory,
  findMyDeviceBookings,
  forgetDeviceBooking
} from '../src/lib/deviceBookingHistory.ts';

const makeBooking=(id,phone='0368557668',extra={})=>({
  id,type:'limousine',bookingDate:'06/11/2026',
  travelDate:'2026-11-07',departureTime:'08:00',
  passengerName:'Khách thử nghiệm',passengerPhone:phone,passengerEmail:'',
  pickupPoint:'Hà Nội',dropoffPoint:'Mộc Châu',
  totalPrice:600000,status:'pending',deviceId:'this-device',...extra
});
const storage=new Map();
globalThis.window={
  localStorage:{
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  }
};

test('Phone must match the FULL booking number, never a digit or ticket code',()=>{
  storage.clear();
  rememberDeviceBooking(makeBooking('ticket-1'));
  const saved=readDeviceBookingHistory();
  for(const query of ['','0','036','036855','ticket-1','036855766']) {
    assert.deepEqual(findMyDeviceBookings(query,saved,[],[],undefined,'this-device'),[],query);
  }
  assert.equal(findMyDeviceBookings('0368557668',saved,[],[],undefined,'this-device').length,1);
  assert.equal(findMyDeviceBookings('0368557669',saved,[],[],undefined,'this-device').length,0);
  assert.ok(isCompleteBookingPhone('0368557668'));
  assert.equal(isCompleteBookingPhone('0'),false);
});

test('Vietnam country code and spaces normalize to the same number',()=>{
  assert.equal(normalizeBookingPhone('+84 368 557 668'),'0368557668');
  assert.equal(normalizeBookingPhone('0084 368 557 668'),'0368557668');
  assert.equal(normalizeBookingPhone('84 368 557 668'),'0368557668');
});

test('Device history persists across reload and contains no operator financial notes',()=>{
  storage.clear();
  const row=makeBooking('ticket-2', '0368557668', {
    operatorNotes:'Bank account details that must never be cached',
    driverPhone:'0000000000',
    notes:'Private medical or travel preferences'
  });
  assert.equal(rememberDeviceBooking(row),true);
  const raw=storage.get(DEVICE_BOOKING_HISTORY_KEY);
  assert.equal(typeof raw,'string');
  assert.equal(raw.includes('Bank account details'),false);
  assert.equal(raw.includes('Private medical'),false);
  assert.equal(raw.includes('0000000000'),false);
  const restored=readDeviceBookingHistory();
  assert.equal(restored[0].id,'ticket-2');
  assert.equal(findMyDeviceBookings('0368557668',restored,[],[],undefined,'this-device')[0].id,'ticket-2');
});

test('Same device gets latest verified cloud status, but other devices do not',()=>{
  storage.clear();
  const own=makeBooking('ticket-3');
  rememberDeviceBooking(own);
  const live=makeBooking('ticket-3','0368557668',{status:'success'});
  const result=findMyDeviceBookings('0368557668',readDeviceBookingHistory(),[live],[],undefined,'this-device');
  assert.equal(result[0].status,'success');

  const unknown=makeBooking('different-guest','0368557668',{deviceId:'some-other-device'});
  assert.deepEqual(findMyDeviceBookings('0368557668',[],[unknown],[],undefined,'this-device'),[]);
  assert.deepEqual(findMyDeviceBookings('0368557668',[],[unknown],[],undefined,'another-device'),[]);
});

test('A logged-in customer can see own account tickets, not other accounts',()=>{
  storage.clear();
  const cloud=[makeBooking('mine','0368557668',{userId:'customer-1'}),makeBooking('other','0368557668',{userId:'customer-2'})];
  const mine=findMyDeviceBookings('0368557668',[],[],cloud,'customer-1','not-same-device');
  assert.equal(mine.length,1);assert.equal(mine[0].id,'mine');
  assert.deepEqual(findMyDeviceBookings('0368557668',[],[],cloud,undefined,'not-same-device'),[]);
});

test('Remembering an ID updates the saved record; deleting it clears device copy',()=>{
  storage.clear();
  rememberDeviceBooking(makeBooking('ticket-4'));
  rememberDeviceBooking(makeBooking('ticket-4','0368557668',{status:'success'}));
  assert.equal(readDeviceBookingHistory().length,1);
  assert.equal(readDeviceBookingHistory()[0].status,'success');
  forgetDeviceBooking('ticket-4');
  assert.deepEqual(readDeviceBookingHistory(),[]);
});
