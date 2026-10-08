package solid.isp;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import solid.isp.Products.Product;

// EN: VIOLATES THE INTERFACE SEGREGATION PRINCIPLE. One interface serves two kinds of client:
//     those that read and those that write. The report only lists, yet it depends on `save`
//     and `remove`; the CSV catalog cannot write, yet it must implement them, and it does so by
//     throwing. Passing it to `increasePrices` compiles and fails at run time.
// PT: QUEBRA O PRINCÍPIO DA SEGREGAÇÃO DE INTERFACES. Uma interface atende a dois tipos de
//     cliente: os que leem e os que gravam. O relatório só lista, e mesmo assim depende de
//     `save` e `remove`; o catálogo CSV não consegue gravar, e mesmo assim precisa
//     implementá-los, e faz isso lançando exceção. Passá-lo a `increasePrices` compila e falha
//     em tempo de execução.
public final class IspBefore {
  private IspBefore() {}

  public interface ProductCatalog {
    Optional<Product> find(String id);

    List<Product> list();

    void save(Product product);

    void remove(String id);
  }

  static final class MemoryCatalog implements ProductCatalog {
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

  static final class CsvCatalog implements ProductCatalog {
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

    @Override
    public void save(Product product) {
      throw new UnsupportedOperationException("the CSV catalog is read-only");
    }

    @Override
    public void remove(String id) {
      throw new UnsupportedOperationException("the CSV catalog is read-only");
    }
  }

  public static ProductCatalog createMemoryCatalog(List<Product> products) {
    return new MemoryCatalog(products);
  }

  public static ProductCatalog createCsvCatalog(String csv) {
    return new CsvCatalog(csv);
  }

  public static String priceReport(ProductCatalog catalog) {
    return catalog.list().stream().map(Products::reportLine).collect(Collectors.joining("\n"));
  }

  public static void increasePrices(ProductCatalog catalog, int percent) {
    for (Product product : catalog.list()) {
      catalog.save(Products.raised(product, percent));
    }
  }
}
