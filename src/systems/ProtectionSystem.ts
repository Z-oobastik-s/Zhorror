export class ProtectionSystem {
  constructor() {
    this.bind();
  }

  private bind(): void {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && ['s', 'u', 'p', 'a', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === 'F12') e.preventDefault();
    });

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }
}
