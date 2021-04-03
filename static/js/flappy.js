const notas = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const claves = ['clave-do--', 'clave-fa--', 'clave-neutra--', 'clave-sol--']

function novoElemento(tagName, className) {
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

const reproduzirAudio = (file) => {
    const audioPath = 'static/sounds/' + file + '.mp3'
    let coinFlipSound = new Audio(audioPath)
    coinFlipSound.play();
}

function Barreira(reversa = false) {
    this.elemento = novoElemento('div', 'barreira')
    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda)
    this.elemento.appendChild(reversa ? borda : corpo)
    this.setAltura = altura => corpo.style.height = `${altura}px`
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function Meio() {
    this.elemento = novoElemento('div', 'meio')
    const img = novoElemento('img', 'imagem')
    this.elemento.appendChild(img)

    this.setAltura = altura => this.elemento.style.height = `${altura}px`
    this.setImage = nota => {
        const clave = claves[3]
        img.src = 'static/imgs/' + clave + nota + '.png'
        img.setAttribute('som', nota)
    }
    this.reproduzirAudio = () => reproduzirAudio(img.getAttribute('som'))
}

function Obstaculo(altura, abertura, x) {
    this.elemento = novoElemento('div', 'par-de-barreiras')

    this.superior = new Barreira(true)
    this.meio = new Meio()
    this.inferior = new Barreira(false)

    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.meio.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    this.sortearNota = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior
        this.meio.setAltura(abertura)
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
        const nota = notas[getRandomInt(notas.length)]
        this.meio.setImage(nota)
    }

    this.getX = () => parseInt(this.elemento.style.left.split('pix')[0])
    this.setX = x => this.elemento.style.left = `${x}px`
    this.getLargura = () => this.elemento.clientWidth
    this.tocarSom = () => this.meio.reproduzirAudio()

    this.sortearNota()
    this.setX(x)
}

function Barreiras(altura, largura, abertura, espaco, deslocamento, notificarPonto) {
    this.obstaculos = [
        new Obstaculo(altura, abertura, largura),
        new Obstaculo(altura, abertura, largura + espaco),
        new Obstaculo(altura, abertura, largura + espaco * 2),
        new Obstaculo(altura, abertura, largura + espaco * 3),
    ]

    this.animar = () => {
        this.obstaculos.forEach(obstaculo => {
            obstaculo.setX(obstaculo.getX() - deslocamento)
            if (obstaculo.getX() < -obstaculo.getLargura()) {
                obstaculo.setX(obstaculo.getX() + espaco * this.obstaculos.length)
                obstaculo.sortearNota()
            }

            const meio = largura / 2
            const cruzouOMeio = obstaculo.getX() + deslocamento >= meio && obstaculo.getX() < meio
            if (cruzouOMeio) {
                notificarPonto()
                obstaculo.tocarSom()
            }
        })
    }
}

function Passaro(alturaJogo) {
    let voando = false
    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'static/imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('pix')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = e => voando = true
    window.onmousedown = e => voando = true

    window.onkeyup = e => voando = false
    window.onmouseup = e => voando = false

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5)
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if (novoY <= 0) {
            this.setY(0)
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }
    this.setY(alturaJogo / 2)
}

function Progresso() {
    this.elemento = novoElemento('span', 'progresso')
    this.atualizarPontos = pontos => this.elemento.innerHTML = pontos
    this.atualizarPontos(0)
}

function Restart() {
    this.elemento = novoElemento('div', 'restart')
    this.elemento.style.display = 'none'

    const titulo = novoElemento('h1', 'restart__titulo')
    titulo.innerHTML = 'Game Over'
    this.elemento.appendChild(titulo)

    const tenteNovamente = novoElemento('h2', 'restart__subtitulo')
    tenteNovamente.innerHTML = 'Jogar Novamente'
    this.elemento.appendChild(tenteNovamente)

    const restartButton = novoElemento('input', 'btn restart__button')
    restartButton.type = 'button'
    restartButton.style = "background-image:url('static/imgs/playbtn.png')"
    restartButton.onclick = () => location.reload()

    this.elemento.appendChild(restartButton)

    this.show = () => this.elemento.style.display = 'flex'
    this.hide = () => this.elemento.style.display = 'none'
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect()
    const b = elementoB.getBoundingClientRect()

    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top

    return horizontal && vertical
}

function colidiu(passaro, barreiras) {
    let colidiu = false
    barreiras.obstaculos.forEach(parDeBarreiras => {
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior)
        }
    })
    return colidiu
}

function FlappyBird() {
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const restart = new Restart()
    const barreiras = new Barreiras(altura, largura, 200, 400, 3, () => progresso.atualizarPontos(++pontos))
    const passaro = new Passaro(altura)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(restart.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.obstaculos.forEach(par => areaDoJogo.appendChild(par.elemento))

    this.start = () => {
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()
            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador)
                restart.show()
            }
        }, 20)
    }
}

new FlappyBird().start()