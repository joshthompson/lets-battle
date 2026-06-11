export default function Menu(props: { onStart: () => void }) {
  return (
    <div class="screen">
      <h1 class="menu-logo">
        <span class="lets">Let's</span>
        Battle
      </h1>
      <button class="start-btn" onClick={props.onStart}>
        Start
      </button>
    </div>
  );
}
