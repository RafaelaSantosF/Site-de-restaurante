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

// script.js — colocar no final do body (substitui o antigo)

// Configurações
const STORAGE_KEYS = ['cart', 'pedido']; // salva em ambas as chaves pra compatibilidade
const HEADER_COUNT_ID = 'item-count';    // id do span no header que mostra a contagem
const REDIRECT_AFTER_ADD = true;         // true: vai para pedido.html depois de adicionar
const REDIRECT_TARGET = 'pedido.html';

// Lê array do localStorage (ou retorna [])
function readStorage(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro lendo localStorage key=' + key, e);
        return [];
    }
}

// Salva array no localStorage
function saveStorage(key, arr) {
    try {
        localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
        console.error('Erro salvando localStorage key=' + key, e);
    }
}

// Retorna o total de itens (soma qty) a partir de uma chave
function countItemsInKey(key) {
    const cart = readStorage(key);
    return cart.reduce((s, it) => s + (it.qty || 0), 0);
}

// Atualiza o contador no header (se existir)
function updateHeaderCount() {
    const el = document.getElementById(HEADER_COUNT_ID);
    if (!el) return;
    // tenta a chave 'cart' primeiro, se vazio tenta 'pedido'
    let count = countItemsInKey('cart');
    if (!count) count = countItemsInKey('pedido');
    el.textContent = count;
}

// Normaliza valor numérico do preço, aceita "48.00" ou "48,00" ou número
function parsePrice(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // remove espaços e moeda
    let s = String(val).trim().replace('R$', '').replace('r$', '').replace(/\s/g, '');
    s = s.replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

// Função que adiciona/mergeia o item no array (incrementa qty se mesmo nome+price)
function addOrIncrementItemArray(arr, item) {
    const idx = arr.findIndex(i => String(i.name) === String(item.name) && Number(i.price) === Number(item.price));
    if (idx >= 0) {
        arr[idx].qty = (arr[idx].qty || 1) + (item.qty || 1);
    } else {
        arr.push(Object.assign({ qty: 1 }, item));
    }
    return arr;
}

// Função principal: pega dados do elemento .item e salva
function handleAddButtonClick(btn) {
    const itemEl = btn.closest('.item');
    if (!itemEl) {
        console.error('Botão sem .item pai');
        return;
    }

    // pega dados dos data-*
    const name = itemEl.dataset.name || itemEl.querySelector('h3')?.textContent?.trim() || 'Produto';
    const priceRaw = itemEl.dataset.price || itemEl.querySelector('.preco')?.textContent || '';
    const img = itemEl.dataset.img || itemEl.querySelector('img')?.getAttribute('src') || '';

    const price = parsePrice(priceRaw);

    if (!name || price === 0) {
        // se estiver faltando, ainda adiciona mas com fallback — evita crash
        console.warn('Item com dados incompletos (name/price). name=', name, 'price=', priceRaw);
    }

    const item = {
        name: String(name),
        price: Number(price),
        image: img || '',
        qty: 1
    };

    // salva em ambas as chaves
    STORAGE_KEYS.forEach(key => {
        const arr = readStorage(key);
        addOrIncrementItemArray(arr, item);
        saveStorage(key, arr);
    });

    // atualização visual do contador
    updateHeaderCount();

    // anima o contador (se existir)
    const headerSpan = document.getElementById(HEADER_COUNT_ID);
    if (headerSpan) {
        headerSpan.style.transform = 'scale(1.2)';
        setTimeout(() => headerSpan.style.transform = 'scale(1)', 150);
    }

    // opcional: toast simples
    try {
        showSimpleToast(`${item.name} adicionado ao pedido!`);
    } catch (e) { /* ignora se não funcionar */ }

    // redireciona para pedido.html (quando desejado)
    if (REDIRECT_AFTER_ADD) {
        // pequeno delay para ver a animação / toast
        setTimeout(() => {
            window.location.href = REDIRECT_TARGET;
        }, 300);
    }
}

// Cria um toast simples (não depende de libs)
function showSimpleToast(text) {
    let toast = document.createElement('div');
    toast.textContent = text;
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = 9999;
    toast.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 300ms, transform 300ms';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 900);
    setTimeout(() => toast.remove(), 1300);
}

// Inicializa listeners nos botões .js-add-to-cart
function initAddButtons() {
    // delegação: se botões forem adicionados dinamicamente, reinicia depois
    const buttons = document.querySelectorAll('.js-add-to-cart');
    if (!buttons || buttons.length === 0) {
        // não encontrou — ok, mas atualiza contador só
        updateHeaderCount();
        return;
    }

    buttons.forEach(btn => {
        // previne múltiplos listeners
        btn.removeEventListener('click', btn._addHandler || (()=>{}));
        const handler = () => handleAddButtonClick(btn);
        btn.addEventListener('click', handler);
        // guarda referência para evitar duplicação
        btn._addHandler = handler;
    });
}

// Quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    initAddButtons();
    updateHeaderCount();
});

// Também atualiza quando localStorage é alterado em outra aba
window.addEventListener('storage', () => updateHeaderCount());



document.querySelectorAll('.topicos nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault(); // impede o scroll para o ID

        const alvo = this.getAttribute('href').substring(1); // pega "cardapio", "bebida", etc

        // Remove classe ativa de todas as seções
        document.querySelectorAll('.menu-lista').forEach(sec => {
            sec.classList.remove('ativa');
        });

        // Adiciona classe ativa só na seção clicada
        document.getElementById(alvo).classList.add('ativa');
    });
});
