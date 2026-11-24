const form = document.getElementById('formInscricao')
const selectEstado = document.getElementById('estado')
const selectCidade = document.getElementById('cidade')
const camposCidade = document.getElementById('camposCidade')
const filtro = document.getElementById('filtro')
const qtdCidades = document.getElementById('qtdCidades')
const resumo = document.getElementById('resumo')
const erro = document.getElementById('erro')
const tentarNovamente = document.getElementById('tentarNovamente')
const inscrever = document.getElementById('inscrever')
const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados'

let cidades = []
let consultaAtual = 0

async function buscar(url) {
    const resposta = await fetch(url)
    if (!resposta.ok) throw new Error('Falha na consulta ao IBGE')
    return resposta.json()
}

function mostrarErro(mensagem) {
    erro.textContent = mensagem
    tentarNovamente.hidden = !mensagem
}

async function carregarEstados() {
    mostrarErro('')
    selectEstado.replaceChildren(new Option('Carregando estados...', ''))
    try {
        const estados = await buscar(URL_ESTADOS + '?orderBy=nome')
        selectEstado.replaceChildren(new Option('Selecione o estado', ''))
        for (const estado of estados) {
            selectEstado.add(new Option(estado.nome, estado.sigla))
        }
        selectEstado.disabled = false
    } catch {
        selectEstado.replaceChildren(new Option('Estados indisponíveis', ''))
        mostrarErro('Não foi possível carregar os estados.')
    }
}

function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function filtrarCidades() {
    const termo = normalizar(filtro.value)
    const anterior = selectCidade.value
    const resultados = cidades.filter(nome => normalizar(nome).includes(termo))
    const aviso = resultados.length ? 'Selecione a cidade' : 'Nenhuma cidade encontrada'
    selectCidade.replaceChildren(new Option(aviso, ''))
    for (const nome of resultados) {
        selectCidade.add(new Option(nome, nome))
    }
    if (resultados.includes(anterior)) selectCidade.value = anterior
    selectCidade.disabled = resultados.length === 0
    inscrever.disabled = !selectCidade.value
}

async function carregarCidades() {
    const uf = selectEstado.value
    // Uma resposta atrasada deve respeitar a escolha mais recente.
    const consulta = ++consultaAtual
    cidades = []
    camposCidade.hidden = !uf
    filtro.value = ''
    filtro.disabled = true
    selectCidade.disabled = true
    inscrever.disabled = true
    qtdCidades.textContent = ''
    resumo.textContent = ''
    mostrarErro('')
    selectCidade.replaceChildren(new Option('Carregando...', ''))
    if (!uf) return

    try {
        const municipios = await buscar(URL_ESTADOS + '/' + uf + '/municipios')
        if (consulta !== consultaAtual) return
        cidades = municipios.map(cidade => cidade.nome).sort((a, b) => a.localeCompare(b, 'pt-BR'))
        filtrarCidades()
        filtro.disabled = cidades.length === 0
        const estado = selectEstado.selectedOptions[0].text
        qtdCidades.textContent = estado + ' tem ' + cidades.length + (cidades.length === 1 ? ' cidade.' : ' cidades.')
    } catch {
        if (consulta !== consultaAtual) return
        selectCidade.replaceChildren(new Option('Cidades indisponíveis', ''))
        mostrarErro('Não foi possível carregar as cidades.')
    }
}

selectEstado.addEventListener('change', carregarCidades)
filtro.addEventListener('input', filtrarCidades)
selectCidade.addEventListener('change', () => {
    inscrever.disabled = !selectCidade.value
})
tentarNovamente.addEventListener('click', () => {
    if (selectEstado.value) carregarCidades()
    else carregarEstados()
})
form.addEventListener('input', () => { resumo.textContent = '' })
form.addEventListener('submit', evento => {
    evento.preventDefault()
    if (inscrever.disabled || !form.reportValidity()) return
    const nome = form.elements.nome.value.trim()
    resumo.textContent = nome + ', de ' + selectCidade.value + '/' + selectEstado.value + ', inscrito com sucesso.'
})

carregarEstados()
