    // --- UTILIDADES ---
    const STORAGE_KEY = 'cart'; // chave no localStorage

    function readCart() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro lendo cart:', e);
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        updateHeaderCount();
    }

    function formatPrice(v) {
        return Number(v).toFixed(2);
    }

    // --- RENDERIZAÇÃO ---
    const carrinhoEl = document.getElementById('carrinho');
    const emptyEl = document.getElementById('empty-message');
    const resumoEl = document.getElementById('resumo');
    const totalEl = document.getElementById('total');
    const resumoItensEl = document.getElementById('resumo-itens');
    const countDisplay = document.getElementById('count-display');
    const itemCountHeader = document.getElementById('item-count');

    function renderCart() {
        const cart = readCart();
        carrinhoEl.innerHTML = '';

        if (!cart.length) {
            emptyEl.style.display = 'block';
            resumoEl.style.display = 'none';
            countDisplay.textContent = '0';
            itemCountHeader.textContent = '0';
            return;
        }

        emptyEl.style.display = 'none';
        resumoEl.style.display = 'flex';

        let total = 0;
        let itens = 0;

        cart.forEach((it, idx) => {
            total += it.price * it.qty;
            itens += it.qty;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <img src="${it.image || ''}" alt="${escapeHtml(it.name)}" onerror="this.style.display='none'">
                <div class="cart-details">
                    <h3>${escapeHtml(it.name)}</h3>
                    <div class="preco">R$ ${formatPrice(it.price)}</div>
                    <div class="descricao">${escapeHtml(it.note || '')}</div>
                </div>
                <div class="cart-controls">
                    <div class="qty-controls">
                        <button data-action="dec" data-idx="${idx}">-</button>
                        <div style="min-width:34px;text-align:center;">${it.qty}</div>
                        <button data-action="inc" data-idx="${idx}">+</button>
                    </div>
                    <button class="remove-btn" data-action="remove" data-idx="${idx}">Remover</button>
                </div>
            `;
            carrinhoEl.appendChild(itemDiv);
        });

        totalEl.textContent = formatPrice(total);
        resumoItensEl.textContent = itens;
        countDisplay.textContent = itens;
        itemCountHeader.textContent = itens;

        // adiciona listeners nos botões gerados
        carrinhoEl.querySelectorAll('button').forEach(b => {
            const action = b.dataset.action;
            const idx = Number(b.dataset.idx);
            if (action === 'inc') {
                b.addEventListener('click', () => changeQty(idx, +1));
            } else if (action === 'dec') {
                b.addEventListener('click', () => changeQty(idx, -1));
            } else if (action === 'remove') {
                b.addEventListener('click', () => removeItem(idx));
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    // --- AÇÕES ---
    function changeQty(index, delta) {
        const cart = readCart();
        if (!cart[index]) return;
        cart[index].qty = Math.max(1, cart[index].qty + delta);
        saveCart(cart);
        renderCart();
    }

    function removeItem(index) {
        const cart = readCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
    }

    document.getElementById('limpar').addEventListener('click', () => {
        if (!confirm('Deseja limpar o carrinho?')) return;
        localStorage.removeItem(STORAGE_KEY);
        renderCart();
    });

    document.getElementById('checkout').addEventListener('click', () => {
        const cart = readCart();
        if (!cart.length) {
            alert('Seu carrinho está vazio.');
            return;
        }
        // aqui você pode mandar para backend, página de checkout, etc.
        // por enquanto só mostra um resumo:
        alert('Pedido finalizado!\nTotal: R$ ' + formatPrice(cart.reduce((s,i)=>s+i.price*i.qty,0)));
        // limpar após finalizar (opcional)
        localStorage.removeItem(STORAGE_KEY);
        renderCart();
    });

    // atualiza contador no header (caso a página original faça alteração)
    function updateHeaderCount() {
        const cart = readCart();
        const count = cart.reduce((s,i)=>s + (i.qty||0), 0);
        if (itemCountHeader) itemCountHeader.textContent = count;
        if (countDisplay) countDisplay.textContent = count;
    }

    // --- Aceitar adição via query string:
    // exemplo: pedido.html?name=Tacaca&price=25.00&image=/Img/Tacaca.jpg
    function addItemFromQuery() {
        const url = new URL(location.href);
        const name = url.searchParams.get('name');
        const price = url.searchParams.get('price');
        const image = url.searchParams.get('image');
        const note = url.searchParams.get('note');

        if (!name || !price) return;

        const cart = readCart();
        // se já existe, incrementa
        const found = cart.find(i => i.name === name && i.price === Number(price));
        if (found) {
            found.qty = (found.qty || 1) + 1;
        } else {
            cart.push({
                name: name,
                price: Number(price),
                qty: 1,
                image: image || '',
                note: note || ''
            });
        }
        saveCart(cart);

        // opcional: remover params da url após adicionar (para evitar repetir ao recarregar)
        url.searchParams.delete('name');
        url.searchParams.delete('price');
        url.searchParams.delete('image');
        url.searchParams.delete('note');
        history.replaceState(null, '', url.toString());
    }

    // run
    addItemFromQuery();
    renderCart();

    // atualiza contador se outra aba modifica o localStorage
    window.addEventListener('storage', () => {
        renderCart();
    });

    // --- Sugestão: função para outras páginas chamarem --- 
    // Se você quiser que o botão "Adicionar" da página do cardápio
    // redirecione para pedido.html e já adicione o item, use algo como:
    //
    // window.location.href = `pedido.html?name=${encodeURIComponent(name)}&price=${price}&image=${encodeURIComponent(image)}`;
    //
    // Ou use localStorage diretamente:
    // (este snippet aqui não roda nesta página, é só exemplo)
    //
    // function addToCartAndGo(name, price, image) {
    //   const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    //   const found = existing.find(i => i.name === name && i.price === Number(price));
    //   if (found) found.qty = (found.qty||1) + 1;
    //   else existing.push({ name, price: Number(price), qty: 1, image });
    //   localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    //   window.location.href = 'pedido.html';
    // }

    const listaHTML = document.getElementById("lista-pedido");

    // Pega os itens do localStorage
    const cart = JSON.parse(localStorage.getItem("pedido")) || [];

    if (cart.length === 0) {
        listaHTML.innerHTML = "<p>Seu pedido está vazio.</p>";
    } else {
        cart.forEach(item => {
            const card = `
                <div class="item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="detalhes">
                        <h3>${item.name}</h3>
                        <p class="preco">R$ ${item.price}</p>
                    </div>
                </div>
            `;
            listaHTML.innerHTML += card;
        });
    }

