package solid.isp;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import solid.isp.Products.Product;

// EN: INTERFACE SEGREGATION. Two interfaces, one per kind of client. A class implements what it
//     really offers, and a method asks for the narrowest type that does its job. Java has no
//     `A & B` type for a parameter, so `increasePrices` uses a generic bound,
//     `<C extends ProductReader & ProductWriter>`: it accepts any class with both roles and
//     needs no third interface. The CSV catalog is not a writer, so the call does not compile.
// PT: SEGREGAÇÃO DE INTERFACES. Duas interfaces, uma por tipo de cliente. Uma classe implementa
//     o que realmente oferece, e um método pede o tipo mais estreito que resolve o seu trabalho.
//     Java não tem um tipo `A & B` para parâmetros, então `increasePrices` usa um limite
//     genérico, `<C extends ProductReader & ProductWriter>`: aceita qualquer classe com os dois
//     papéis e dispensa uma terceira interface. O catálogo CSV não é um escritor, então a
//     chamada não compila.
// ES: SEGREGACIÓN DE INTERFACES. Dos interfaces, una por tipo de cliente. Una clase implementa
//     lo que realmente ofrece, y un método pide el tipo más estrecho que resuelve su trabajo.
//     Java no tiene un tipo `A & B` para parámetros, así que `increasePrices` usa una cota
//     genérica, `<C extends ProductReader & ProductWriter>`: acepta cualquier clase con los dos
//     roles y evita una tercera interfaz. El catálogo CSV no es un escritor, así que la
//     llamada no compila.
public final class IspAfter {
  private IspAfter() {}

  public interface ProductReader {
    Optional<Product> find(String id);

    List<Product> list();
  }

  public interface ProductWriter {
    void save(Product product);

    void remove(String id);
  }

  public static final class MemoryCatalog implements ProductReader, ProductWriter {
    private final Map<String, Product> products = new LinkedHashMap<>();

    MemoryCatalog(List<Product> initial) {
      for (Product product : initial) {
        products.put(product.id(), product);
      }
    }

    @Override
    public Optional<Product> find(String id) {
      return Optional.ofNullable(products.get(id));
    }

    @Override
    public List<Product> list() {
      return new ArrayList<>(products.values());
    }

    @Override
    public void save(Product product) {
      products.put(product.id(), product);
    }

    @Override
    public void remove(String id) {
      products.remove(id);
    }
  }

  static final class CsvCatalog implements ProductReader {
    private final List<Product> products;

    CsvCatalog(String csv) {
      this.products = Products.parseCsv(csv);
    }

    @Override
    public Optional<Product> find(String id) {
      return products.stream().filter(product -> product.id().equals(id)).findFirst();
    }

    @Override
    public List<Product> list() {
      return new ArrayList<>(products);
    }
  }

  public static MemoryCatalog createMemoryCatalog(List<Product> products) {
    return new MemoryCatalog(products);
  }

  public static ProductReader createCsvCatalog(String csv) {
    return new CsvCatalog(csv);
  }

  public static String priceReport(ProductReader catalog) {
    return catalog.list().stream().map(Products::reportLine).collect(Collectors.joining("\n"));
  }

  public static <C extends ProductReader & ProductWriter> void increasePrices(
      C catalog, int percent) {
    for (Product product : catalog.list()) {
      catalog.save(Products.raised(product, percent));
    }
  }
}
