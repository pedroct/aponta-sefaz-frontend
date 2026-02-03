import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ADOButton,
  ADOCard,
  ADOHeader,
  ADOInput,
  ADOModal,
  ADOMultiSelect,
  ADOTable,
  ADOToolbar,
} from "@/components/ado";

describe("ADO components", () => {
  it("renders ADOButton with variant, icon and handles click", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ADOButton variant="danger" icon={<span data-testid="icon" />} onClick={onClick}>
        Excluir
      </ADOButton>
    );

    const button = screen.getByRole("button", { name: "Excluir" });
    expect(button).toHaveClass("bg-[#A80000]");
    expect(screen.getByTestId("icon")).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders ADOCard content and merges className", () => {
    render(
      <ADOCard className="custom-class">
        <span>Conteúdo</span>
      </ADOCard>
    );

    expect(screen.getByText("Conteúdo").parentElement).toHaveClass("custom-class");
  });

  it("renders ADOHeader with title and children", () => {
    render(
      <ADOHeader title="Título">
        <div>Header extra</div>
      </ADOHeader>
    );

    expect(screen.getByRole("heading", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByText("Header extra")).toBeInTheDocument();
  });

  it("renders ADOInput with label, error and calls onChange", () => {
    const onChange = vi.fn();
    render(
      <ADOInput
        label="Nome"
        placeholder="Digite"
        error="Obrigatório"
        onChange={onChange}
      />
    );

    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Obrigatório")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Digite");
    fireEvent.change(input, { target: { value: "Teste" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders ADOToolbar and triggers search/filter callbacks", () => {
    const onSearch = vi.fn();
    const onFilter = vi.fn();

    render(
      <ADOToolbar
        onSearch={onSearch}
        onFilter={onFilter}
        leftContent={<span>Left</span>}
        rightContent={<span>Right</span>}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    expect(onFilter).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText("Pesquisar..."), { target: { value: "abc" } });
    expect(onSearch).toHaveBeenCalledWith("abc");

    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("renders ADOMultiSelect and toggles selections", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const options = [
      { value: "opt-1", label: "Opção 1" },
      { value: "opt-2", label: "Opção 2" },
    ];

    render(
      <ADOMultiSelect
        options={options}
        placeholder="Selecione..."
        onChange={onChange}
        value={[]}
      />
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Opção 1"));
    expect(onChange).toHaveBeenCalledWith(["opt-1"]);
  });

  it("renders ADOMultiSelect actions (select all / clear)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const options = [
      { value: "opt-1", label: "Opção 1" },
      { value: "opt-2", label: "Opção 2" },
    ];

    render(<ADOMultiSelect options={options} onChange={onChange} value={["opt-1"]} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Selecionar tudo"));
    expect(onChange).toHaveBeenCalledWith(["opt-1", "opt-2"]);

    await user.click(screen.getByText("Limpar"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("renders ADOTable with loading and empty states", () => {
    const columns = [{ key: "name", header: "Nome" }];
    const { rerender } = render(
      <ADOTable data={[]} columns={columns} isLoading emptyText="Sem dados" />
    );

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    rerender(<ADOTable data={[]} columns={columns} emptyText="Sem dados" />);
    expect(screen.getByText("Sem dados")).toBeInTheDocument();
  });

  it("renders ADOTable rows and actions", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const columns = [{ key: "name", header: "Nome" }];
    const data = [{ id: "1", name: "Item 1" }];

    render(
      <ADOTable
        data={data}
        columns={columns}
        rowKey="id"
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Excluir"));
    expect(onEdit).toHaveBeenCalledWith(data[0]);
    expect(onDelete).toHaveBeenCalledWith(data[0]);
  });

  it("renders ADOModal footer and handles cancel/confirm", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ADOModal open onOpenChange={onOpenChange} title="Título" onConfirm={onConfirm}>
        <div>Conteúdo</div>
      </ADOModal>
    );

    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
