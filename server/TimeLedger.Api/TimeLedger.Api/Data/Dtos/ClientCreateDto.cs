using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Dtos
{
	public class ClientCreateDto
	{
		[Required]
		[MaxLength(100)]
		public string Name { get; set; } = string.Empty;

	}
}
