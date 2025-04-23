export function gerarCPF() {
    let cpf = '';
  
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10);
    }
  
    let soma = 0;
    for (let i = 0, peso = 10; i < 9; i++, peso--) {
      soma += parseInt(cpf[i]) * peso;
    }
    let resto = soma % 11;
    const digito1 = (resto < 2) ? 0 : 11 - resto;
  
    cpf += digito1;
  
    soma = 0;
    for (let i = 0, peso = 11; i < 10; i++, peso--) {
      soma += parseInt(cpf[i]) * peso;
    }
    resto = soma % 11;
    const digito2 = (resto < 2) ? 0 : 11 - resto;
  
    cpf += digito2;
  
    return cpf;
  }
  