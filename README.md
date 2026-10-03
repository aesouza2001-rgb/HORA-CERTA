# HORA CERTA — MVP 0.1

Protótipo funcional inicial para teste familiar.

## O que já funciona
- Cadastro de pessoas no dispositivo
- Seleção do funcionário
- Registro de ponto
- Data e hora
- Solicitação de geolocalização
- Histórico
- Jornada padrão de 8h
- Saldo diário
- Banco de horas
- Painel administrativo simples
- Persistência local no navegador

## Importante
Esta versão é um MVP de teste e NÃO deve ser usada como sistema oficial de ponto eletrônico/REP-P.

## Como testar
Abra `index.html` em um navegador. Para o GPS funcionar de forma confiável em celulares, o projeto deve ser servido por HTTPS (ou ambiente local seguro).

## Próxima evolução
1. Backend/API
2. PostgreSQL
3. Login real
4. Empresa e usuários separados
5. Geofence
6. Sincronização entre celulares
7. Auditoria
8. Comprovante
9. AFD/AEJ e requisitos REP-P
10. Publicação Android/iOS

## Geolocalização com endereço
A versão 0.2 tenta converter as coordenadas GPS em rua, número, bairro, cidade e CEP usando geocodificação reversa do OpenStreetMap/Nominatim. Para produto comercial, devemos usar um serviço de geocodificação com política de uso adequada, cache e controles de privacidade.
