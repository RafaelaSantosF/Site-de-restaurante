// Arquivo: script.js
document.addEventListener('DOMContentLoaded', () => {
    let itemCount = 0;
    const itemCountElement = document.getElementById('item-count');
    const botoesAdicionar = document.querySelectorAll('.js-add-to-cart');

    const adicionarAoCarrinho = (evento) => {
        evento.preventDefault(); 
        itemCount++;
        itemCountElement.textContent = itemCount;

        const botao = evento.target;
        const itemElemento = botao.closest('.item');
        const nomeDoPrato = itemElemento.getAttribute('data-name');
        
        // Simulação de feedback visual: Desabilita o botão temporariamente
        botao.textContent = 'Adicionado!';
        botao.disabled = true;

        setTimeout(() => {
            botao.textContent = 'Adicionar';
            botao.disabled = false;
        }, 800);

        console.log(`[JS INTERATIVO]: ${nomeDoPrato} adicionado. Total: ${itemCount}`);
    };

    botoesAdicionar.forEach(botao => {
        botao.addEventListener('click', adicionarAoCarrinho);
    });
});