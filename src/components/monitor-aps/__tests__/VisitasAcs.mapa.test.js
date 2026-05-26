const fs = require('fs');
const path = require('path');

it('mapa useEffect passes filtroAgente, filtroDesfecho, filtroGeo params', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../VisitasAcs.js'), 'utf8'
    );
    expect(src).toMatch(/\[aba, ano, mes, ine, filtroAgente, filtroDesfecho, filtroGeo\]/);
    expect(src).toMatch(/params\.set\('agente', filtroAgente\)/);
    expect(src).toMatch(/params\.set\('desfecho', filtroDesfecho\)/);
    expect(src).toMatch(/params\.set\('has_geo', filtroGeo\)/);
});
