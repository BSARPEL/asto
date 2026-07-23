import { Body, Screen, ScreenScroll, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';

export default function TermsScreen() {
  return (
    <Screen>
      <ScreenScroll contentContainerStyle={{ gap: spacing.md }}>
        <Title>Kullanım şartları</Title>
        <Body muted>
          Asto eğlence ve kişisel farkındalık amaçlı astroloji içerikleri sunar. Yorumlar tıbbi,
          hukuki veya finansal tavsiye değildir. Jetonlar ve abonelikler dijital içerik olup ilgili
          mağaza iade kurallarına tabidir.
        </Body>
        <Body muted>
          Uygulamayı kötüye kullanmak, otomasyonla aşırı istek atmak veya başkalarının verilerini
          izinsiz işlemek yasaktır. Bu metin yer tutucudur; yayın öncesi güncellenmelidir.
        </Body>
      </ScreenScroll>
    </Screen>
  );
}
