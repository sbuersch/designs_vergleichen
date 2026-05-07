document.addEventListener("DOMContentLoaded", () => {
    const contentPlaceholders = document.querySelectorAll('[data-content-src]');
    contentPlaceholders.forEach(placeholder => {
        const src = placeholder.getAttribute('data-content-src');
        fetch(src)
            .then(response => response.text())
            .then(html => {
                placeholder.innerHTML = html;
            })
            .catch(err => console.error('Error loading ' + src, err));
    });

    document.querySelectorAll('.btn-modern[data-target]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const contentDiv = document.getElementById(targetId);

            if (contentDiv) {
                contentDiv.classList.toggle('active');

                if (this.id === 'manifestBtn') {
                    this.textContent = contentDiv.classList.contains('active') ? 'Manifest einklappen' : 'Gesamtes Manifest lesen';
                } else {
                    this.textContent = contentDiv.classList.contains('active') ? 'Weniger lesen' : 'Weiterlesen';
                }
            }
        });
    });
});