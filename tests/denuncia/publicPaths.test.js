import { isPublicPath } from "../../src/constants/publicPaths";

test("páginas de denúncia e de consulta são públicas (sem login)", () => {
  expect(isPublicPath("/denuncia")).toBe(true);
  expect(isPublicPath("/denuncia/consulta")).toBe(true);
});

test("o restante do módulo de fiscalizações continua protegido", () => {
  expect(isPublicPath("/fiscalizacoes")).toBe(false);
  expect(isPublicPath("/denuncias")).toBe(false);
});
