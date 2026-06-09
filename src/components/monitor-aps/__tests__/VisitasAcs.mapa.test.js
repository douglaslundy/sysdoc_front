const fs = require('fs');
const path = require('path');

it('MapaVisitasPage passes search and team params to mapa endpoint', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../MapaVisitasPage.js'), 'utf8'
    );
    expect(src).toMatch(/searchAtivo/);
    expect(src).toMatch(/params\.set\('busca', searchAtivo\)/);
    expect(src).toMatch(/params\.set\('ine', equipeIne\)/);
    expect(src).toMatch(/params\.set\('agente', agenteNome\)/);
});
