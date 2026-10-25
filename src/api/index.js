// Punto de entrada de los servicios: cada pantalla importa de acá y no sabe si está
// hablando con la API real (http.js) o con la demo en memoria (demo.js).
import api, { mensajeDeError, authService, courtsHttp, courtTypesHttp, stockHttp, reservationsHttp, tournamentsHttp, competitionTypesHttp, leaguesHttp, coachesAndClassesHttp, receiptsHttp, discountsHttp, documentsHttp, clubConfigHttp, invoicesHttp, refundsHttp, usersHttp } from './http';
import { courtsMock, courtTypesMock, stockMock, reservationsMock, tournamentsMock, competitionTypesMock, leaguesMock, coachesAndClassesMock, receiptsMock, discountsMock, documentsMock, clubConfigMock, invoicesMock, refundsMock, usersMock } from './demo';
import { isDemoPath } from '../utils/portalPaths';

export { mensajeDeError, authService };
export { DEFAULT_CLUB_CONFIG, DEFAULT_COURT_AVAILABILITY, maxBookingDate } from './club';

// La demo (URL/demo/...) no tiene backend: trabaja con los datos en memoria. La app real usa la API.
// Se decide en cada llamada porque se puede pasar de una a otra sin recargar la página.
function withBackend(mock, http) {
  return Object.fromEntries(
    Object.keys(mock).map(name => [
      name,
      (...args) => (isDemoPath() ? mock : http)[name](...args)
    ])
  );
}

export const courtsService = withBackend(courtsMock, courtsHttp);
export const courtTypesService = withBackend(courtTypesMock, courtTypesHttp);
export const stockService = withBackend(stockMock, stockHttp);
export const reservationsService = withBackend(reservationsMock, reservationsHttp);
export const tournamentsService = withBackend(tournamentsMock, tournamentsHttp);
export const competitionTypesService = withBackend(competitionTypesMock, competitionTypesHttp);
export const leaguesService = withBackend(leaguesMock, leaguesHttp);
export const coachesAndClassesService = withBackend(coachesAndClassesMock, coachesAndClassesHttp);
export const receiptsService = withBackend(receiptsMock, receiptsHttp);
export const discountsService = withBackend(discountsMock, discountsHttp);
export const clubConfigService = withBackend(clubConfigMock, clubConfigHttp);
export const documentsService = withBackend(documentsMock, documentsHttp);
export const invoicesService = withBackend(invoicesMock, invoicesHttp);
export const refundsService = withBackend(refundsMock, refundsHttp);
export const usersService = withBackend(usersMock, usersHttp);

export default api;
