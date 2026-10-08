package solid.isp;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

// EN: A supplier's price list arrives as CSV text: `id,name,priceCents`, one product per line.
//     The file belongs to the supplier, so the catalog built on it can be read and not written.
// PT: A lista de preços de um fornecedor chega como texto CSV: `id,name,priceCents`, um produto
//     por linha. O arquivo pertence ao fornecedor, então o catálogo montado sobre ele pode ser
//     lido e não pode ser gravado.
public final class Products {
  private Products() {}

  public record Product(String id, String name, long priceCents) {}

  public static List<Product> parseCsv(String csv) {
    List<Product> products = new ArrayList<>();
    for (String raw : csv.split("\n")) {
      String line = raw.trim();
      if (line.isEmpty()) {
        continue;
      }
      String[] parts = line.split(",");
      if (parts.length != 3) {
        throw new IllegalArgumentException("invalid CSV line: " + line);
      }
      try {
        products.add(new Product(parts[0], parts[1], Long.parseLong(parts[2])));
      } catch (NumberFormatException error) {
        throw new IllegalArgumentException("invalid CSV line: " + line, error);
      }
    }
    return products;
  }

  public static String reportLine(Product product) {
    return String.format(
        Locale.ROOT,
        "%s: %d.%02d",
        product.name(),
        product.priceCents() / 100,
        product.priceCents() % 100);
  }

  public static Product raised(Product product, int percent) {
    long price = Math.round(product.priceCents() * (100 + percent) / 100.0);
    return new Product(product.id(), product.name(), price);
  }
}
