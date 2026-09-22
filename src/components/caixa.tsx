export function Caixa({
  id,
  rotulo,
  marcadoPorPadrao = false,
}: {
  id: string;
  rotulo: string;
  marcadoPorPadrao?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm font-normal">
      <input
        id={id}
        name={id}
        type="checkbox"
        defaultChecked={marcadoPorPadrao}
        className="size-4 accent-emerald-700"
      />
      {rotulo}
    </label>
  );
}
