import test from 'node:test';
import assert from 'node:assert/strict';
import {seatConflict} from '../src/server/githubOnly/seatAvailability.ts';

const incoming={id:'new',type:'limousine',travelDate:'2026-11-10',departureTime:'08:00',routeSelection:'Hà Nội - Mộc Châu',seatNumbers:['A3']};
test('Same seat, route, date and departure is not bookable twice',()=>{
 const prior={...incoming,id:'existing',status:'pending'};
 assert.match(seatConflict(incoming,[prior],[]),/A3/);
});
test('Cancelled bookings and a different day, route or time do not block the seat',()=>{
 const prior={...incoming,id:'existing',status:'cancelled'};
 assert.equal(seatConflict(incoming,[prior],[]),null);
 assert.equal(seatConflict(incoming,[{...prior,status:'success',travelDate:'2026-11-11'}],[]),null);
 assert.equal(seatConflict(incoming,[{...prior,status:'success',departureTime:'09:00'}],[]),null);
 assert.equal(seatConflict(incoming,[{...prior,status:'success',routeSelection:'Mộc Châu - Hà Nội'}],[]),null);
});
test('Offline A3 lock for the same route stops online booking',()=>{
 const lock={seatId:'s3',tripId:'trip_custom_08_00',travelDate:'2026-11-10',routeFrom:'Hà Nội'};
 assert.match(seatConflict(incoming,[],[lock]),/A3/);
 assert.equal(seatConflict(incoming,[],[{...lock,routeFrom:'Mộc Châu'}]),null);
});
test('Shared car seat IDs map to the old 6-seat chart',()=>{
 const client={...incoming,type:'shared_car',seatNumbers:['B1']};
 const hold={seatId:'s2',tripId:'shared_car_trip_custom_08_00',travelDate:'2026-11-10',routeFrom:'Hà Nội'};
 assert.match(seatConflict(client,[],[hold]),/B1/);
});

test('Nine-seat cabin never sells more than its physical capacity',()=>{
 const trip={...incoming,seatNumbers:['3 chỗ Limousine'],seatCount:3};
 const prior={...trip,id:'prior',seatNumbers:['7 chỗ Limousine'],seatCount:7,status:'pending'};
 assert.match(seatConflict(trip,[prior],[]),/còn 2 chỗ/);
 assert.equal(seatConflict({...trip,seatCount:2},[prior],[]),null);
});

test('Booking arrow and dash spellings identify the same trip',()=>{
 const prior={...incoming,id:'other',routeSelection:'Hà Nội - Mộc Châu',seatNumbers:['A3'],status:'success'};
 const client={...incoming,routeSelection:'Hà Nội ➔ Mộc Châu'};
 assert.match(seatConflict(client,[prior],[]),/A3/);
});

test('Three offline locks reduce cabin capacity by three seats',()=>{
 const locks=['s3','s4','s5'].map(seatId=>({travelDate:'2026-11-10',tripId:'trip_custom_08_00',routeFrom:'Hà Nội',seatId}));
 const client={...incoming,seatCount:7,seatNumbers:['7 chỗ Limousine']};
 assert.match(seatConflict(client,[],locks),/còn 6 chỗ/);
});
