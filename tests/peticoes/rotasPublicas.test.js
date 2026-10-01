const nextConfig = require("../../next.config.js");
import { isPublicPath } from "../../src/constants/publicPaths";

describe("rotas públicas da petição", () => {
  test("/petition e /petition/track não exigem login", () => {
    expect(isPublicPath("/petition")).toBe(true);
    expect(isPublicPath("/petition/track")).toBe(true);
  });

  test("os endereços antigos /denuncia continuam públicos (para o redirecionamento)", () => {
    expect(isPublicPath("/denuncia")).toBe(true);
    expect(isPublicPath("/denuncia/consulta")).toBe(true);
  });

  test("/denuncia redireciona para /petition e /denuncia/consulta para /petition/track", async () => {
    const redirects = await nextConfig.redirects();
    const find = (source) => redirects.find((r) => r.source === source);

    expect(find("/denuncia")).toMatchObject({ destination: "/petition", permanent: true });
    expect(find("/denuncia/consulta")).toMatchObject({ destination: "/petition/track", permanent: true });
  });
});
