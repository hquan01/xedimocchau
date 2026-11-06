import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const weather=read('../src/components/MocChauWeatherSection.tsx');
const operator=read('../src/components/operator/LiveWeatherManagement.tsx');
const server=read('../server.ts');
const service=read('../src/lib/directWeather.ts');
const models=read('../src/lib/weatherService.ts');

test('Customer weather labels are model forecasts, not local weather station observations',()=>{
 assert.match(weather,/Dự báo mô hình Open-Meteo/);
 assert.match(weather,/Thời điểm dự báo:/);
 assert.match(weather,/không phải số đo tại trạm/);
 assert.match(weather,/tọa độ/i);
 assert.match(weather,/dubaothoitiet.edu.vn\/son-la\/moc-chau"/);
 assert.doesNotMatch(weather,/Khu vực quan trắc:/);
 assert.doesNotMatch(weather,/Mưa 15 phút\*/); // API interval may vary.
});
test('Operator does not advertise third-party forecast as primary API nor fabricate UV/dew point',()=>{
 assert.match(operator,/Nguồn dự báo mô hình: Open-Meteo/);
 assert.doesNotMatch(operator,/thu nhận trực tiếp từ cổng dubaothoitiet/);
 assert.doesNotMatch(operator,/current\.dewPoint\s*\?\?\s*20\.1/);
 assert.doesNotMatch(operator,/current\.uvIndex\s*\?\?\s*3\.1/);
 assert.match(operator,/Chưa có dữ liệu/);
});
test('Server-side AI answers identify true provider Open-Meteo',()=>{
 assert.doesNotMatch(server,/Trực tiếp từ dubaothoitiet\.edu\.vn/);
 assert.doesNotMatch(server,/Cập nhật trực tiếp từ dubaothoitiet\.edu\.vn/);
 assert.match(server,/Dự báo mô hình Open-Meteo/);
});
test('Weather data fetches current model values and exposes model timestamp',()=>{
 assert.match(service,/api\.open-meteo\.com\/v1\/forecast/);
 assert.match(service,/current:.*temperature_2m/);
 assert.match(service,/time:String\(current\.time/);
 assert.match(models,/Operational forecast provider: Open-Meteo/);
});
