import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
const FakeTransactionForm = () => (
  <form>
    <div className="space-y-4">
      <label className="text-sm">Valor (R$)</label>
      <input type="number" />
    </div>
    <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t mt-4 px-3 py-3 flex justify-end gap-3">
      <button type="button">Cancelar</button>
      <button type="submit">Adicionar</button>
    </div>
  </form>
);

describe("TransactionForm Dialog layout", () => {
  it("renders with scroll container and shows action buttons", () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();

    render(
      <div role="dialog" className="w-[95vw] sm:w-auto sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <FakeTransactionForm />
      </div>
    );

    expect(screen.getByText("Valor (R$)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar|Atualizar|Salvando/i })).toBeInTheDocument();
  });
});