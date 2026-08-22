import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renderiza o conteúdo inicial do EverAfter", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sua história de amor merece um lugar bonito."
    );
    expect(screen.getAllByRole("link", { name: "Criar meu site de casamento" })[0]).toHaveAttribute(
      "href",
      "/sign-up"
    );
  });
});
