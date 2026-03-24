export default function WatchlistItemMeta({ id }: { id: string }) {
  return (
    <>
      <span>
        Selected release <code>{id}</code>
      </span>
      <span>Edit tracking settings without leaving the canonical watchlist item route.</span>
    </>
  );
}
