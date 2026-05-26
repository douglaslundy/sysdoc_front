const fs = require('fs');
const path = require('path');

it('VisitasAcs contains responsabilidade state, fetch, and Cadastrados column', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '../VisitasAcs.js'), 'utf8'
    );
    expect(src).toMatch(/responsabilidade/);
    expect(src).toMatch(/\/visitas\/responsabilidade/);
    expect(src).toMatch(/Cadastrados/);
    expect(src).toMatch(/trim\(\)\.toLowerCase\(\)/);
});
